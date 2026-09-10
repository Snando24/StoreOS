-- Production security hardening. Browser clients no longer upload files or create
-- orders directly; Edge Functions validate requests and invoke these commands.

update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'tenant-assets';

drop policy if exists tenant_assets_insert on storage.objects;
drop policy if exists tenant_assets_update on storage.objects;
drop policy if exists tenant_assets_delete on storage.objects;

-- Never expose raw tenant records to anonymous clients. Public storefront data is
-- served by the catalog Edge Function, which only signs published product media.
drop policy if exists products_public_read on public.products;
drop policy if exists variants_public_read on public.product_variants;
drop policy if exists images_public_read on public.product_images;
drop policy if exists brands_public_read on public.brands;
drop policy if exists categories_public_read on public.categories;
drop policy if exists franchises_public_read on public.franchises;
drop policy if exists tenant_settings_public_read on public.tenant_settings;
drop policy if exists tenants_public_read on public.tenants;
drop policy if exists product_categories_public_read on public.product_categories;
drop policy if exists product_franchises_public_read on public.product_franchises;

-- Retire the residual global-role model. Tenant membership is the only source
-- of operational authorization in the SaaS model.
drop policy if exists staff_manage_store_settings on public.store_settings;
drop policy if exists staff_manage_profiles on public.profiles;
drop policy if exists staff_read_user_roles on public.user_roles;
create policy profiles_self_manage on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy user_roles_self_read on public.user_roles for select to authenticated
  using (user_id = auth.uid());
revoke select on public.catalog_products from anon, authenticated;

-- Remove the remaining single-store policies and scope taxonomy joins to one tenant.
drop policy if exists staff_manage_product_categories on public.product_categories;
drop policy if exists staff_manage_product_franchises on public.product_franchises;
create policy tenant_manage_product_categories on public.product_categories for all to authenticated
  using (
    exists (
      select 1 from public.products p join public.categories c on c.id = product_categories.category_id
      where p.id = product_categories.product_id and p.tenant_id = c.tenant_id and public.is_tenant_staff(p.tenant_id)
    )
  )
  with check (
    exists (
      select 1 from public.products p join public.categories c on c.id = product_categories.category_id
      where p.id = product_categories.product_id and p.tenant_id = c.tenant_id and public.is_tenant_staff(p.tenant_id)
    )
  );
create policy tenant_manage_product_franchises on public.product_franchises for all to authenticated
  using (
    exists (
      select 1 from public.products p join public.franchises f on f.id = product_franchises.franchise_id
      where p.id = product_franchises.product_id and p.tenant_id = f.tenant_id and public.is_tenant_staff(p.tenant_id)
    )
  )
  with check (
    exists (
      select 1 from public.products p join public.franchises f on f.id = product_franchises.franchise_id
      where p.id = product_franchises.product_id and p.tenant_id = f.tenant_id and public.is_tenant_staff(p.tenant_id)
    )
  );

drop view if exists public.catalog_products;
create view public.catalog_products with (security_invoker = true) as
select
  t.id as tenant_id,
  t.slug as tenant_slug,
  p.id as product_id,
  p.slug,
  p.name,
  p.description,
  b.name as brand,
  c.name as category,
  f.name as franchise,
  pv.id as variant_id,
  pv.sku,
  pv.name as variant_name,
  pv.condition_label,
  pv.sale_price_cents,
  pv.compare_at_price_cents,
  pv.currency_code,
  pv.is_presale,
  pv.presale_release_at,
  greatest(ii.current_stock - ii.reserved_stock, 0) as available_stock,
  (
    select pi.storage_path from public.product_images pi
    where pi.product_id = p.id and pi.tenant_id = p.tenant_id
    order by pi.is_primary desc, pi.sort_order asc limit 1
  ) as primary_image_path
from public.products p
join public.tenants t on t.id = p.tenant_id and t.status = 'active'
join public.product_variants pv on pv.product_id = p.id and pv.tenant_id = p.tenant_id and pv.is_active
join public.inventory_items ii on ii.variant_id = pv.id and ii.is_active
left join public.brands b on b.id = p.brand_id and b.tenant_id = p.tenant_id
left join public.categories c on c.id = p.primary_category_id and c.tenant_id = p.tenant_id
left join public.franchises f on f.id = p.primary_franchise_id and f.tenant_id = p.tenant_id
where p.status = 'published';

create table if not exists public.checkout_rate_limit_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  fingerprint text not null check (length(fingerprint) between 32 and 128),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_checkout_rate_limit_window
  on public.checkout_rate_limit_events(tenant_id, fingerprint, created_at desc);
alter table public.checkout_rate_limit_events enable row level security;

create or replace function public.enforce_checkout_rate_limit(
  p_tenant_slug text,
  p_fingerprint text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_tenant_id uuid := public.get_tenant_id_by_slug(p_tenant_slug); v_attempts integer;
begin
  if v_tenant_id is null then raise exception 'tenant_not_found'; end if;
  if p_fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'invalid_request: fingerprint'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_tenant_id::text || p_fingerprint, 0));
  delete from public.checkout_rate_limit_events
  where created_at < timezone('utc', now()) - interval '24 hours';
  select count(*) into v_attempts
  from public.checkout_rate_limit_events
  where tenant_id = v_tenant_id and fingerprint = p_fingerprint and created_at > timezone('utc', now()) - interval '10 minutes';
  if v_attempts >= 5 then raise exception 'rate_limited: retry_later'; end if;
  insert into public.checkout_rate_limit_events(tenant_id, fingerprint) values(v_tenant_id, p_fingerprint);
  return v_tenant_id;
end;
$$;

create or replace function public.validate_tenant_customer_identity(
  p_tenant_slug text,
  p_phone text,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_tenant_id uuid := public.get_tenant_id_by_slug(p_tenant_slug); v_phone_customer uuid; v_email_customer uuid;
begin
  if v_tenant_id is null then raise exception 'tenant_not_found'; end if;
  select id into v_phone_customer from public.customers
  where tenant_id = v_tenant_id and phone = nullif(regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g'), '') limit 1;
  select id into v_email_customer from public.customers
  where tenant_id = v_tenant_id and email = nullif(btrim(coalesce(p_email, '')), '')::citext limit 1;
  if v_phone_customer is not null and v_email_customer is not null and v_phone_customer <> v_email_customer then
    raise exception 'customer_identity_conflict: contact_support';
  end if;
end;
$$;

-- Self-service provisioning requires a verified account and is capped until a
-- billing/entitlement system is connected.
create or replace function public.provision_tenant(
  p_slug text,
  p_store_name text,
  p_currency_code text default 'PEN'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_tenant_id uuid; v_email_confirmed_at timestamptz; v_created_today integer;
begin
  if auth.uid() is null then raise exception 'forbidden: authentication_required'; end if;
  select email_confirmed_at into v_email_confirmed_at from auth.users where id = auth.uid();
  if v_email_confirmed_at is null then raise exception 'forbidden: verified_email_required'; end if;
  select count(*) into v_created_today from public.tenant_memberships
  where user_id = auth.uid() and role = 'owner' and created_at > timezone('utc', now()) - interval '24 hours';
  if v_created_today >= 3 then raise exception 'rate_limited: tenant_provisioning_limit'; end if;
  if coalesce(btrim(p_store_name), '') = '' then raise exception 'invalid_request: store_name_required'; end if;
  insert into public.profiles (id) values (auth.uid()) on conflict (id) do nothing;
  insert into public.tenants (slug, name) values (lower(btrim(p_slug)), btrim(p_store_name)) returning id into v_tenant_id;
  insert into public.tenant_settings (tenant_id, store_name, order_prefix, currency_code)
  values (v_tenant_id, btrim(p_store_name), 'ORD', upper(btrim(p_currency_code)));
  insert into public.tenant_memberships (tenant_id, user_id, role) values (v_tenant_id, auth.uid(), 'owner');
  insert into public.audit_log (tenant_id, entity_type, entity_id, action, actor_user_id)
  values (v_tenant_id, 'tenant', v_tenant_id, 'provisioned', auth.uid());
  return v_tenant_id;
end;
$$;

revoke all on function public.create_tenant_order(text, text, jsonb, jsonb, jsonb, jsonb) from anon, authenticated;
revoke all on function public.enforce_checkout_rate_limit(text, text) from public;
revoke all on function public.validate_tenant_customer_identity(text, text, text) from public;
revoke all on function public.release_expired_reservations() from public;
grant execute on function public.create_tenant_order(text, text, jsonb, jsonb, jsonb, jsonb) to service_role;
grant execute on function public.enforce_checkout_rate_limit(text, text) to service_role;
grant execute on function public.validate_tenant_customer_identity(text, text, text) to service_role;
grant execute on function public.release_expired_reservations() to service_role;

-- The catalog-creation RPC remains available to authenticated tenant staff, so
-- enforce the same bounds in the database that the UI applies. This prevents a
-- forged browser request from turning a JSON field into unbounded storage.
create or replace function public.tenant_create_product(
  p_tenant_slug text,
  p_product jsonb,
  p_variants jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_tenant_id_by_slug(p_tenant_slug);
  v_product_id uuid; v_category_id uuid; v_brand_id uuid; v_variant record; v_variant_id uuid;
  v_name text := nullif(btrim(coalesce(p_product ->> 'name', '')), '');
  v_slug text := lower(nullif(btrim(coalesce(p_product ->> 'slug', '')), ''));
  v_category_name text := nullif(btrim(coalesce(p_product ->> 'categoryName', '')), '');
  v_brand_name text := nullif(btrim(coalesce(p_product ->> 'brandName', '')), '');
  v_description text := coalesce(p_product ->> 'description', '');
  v_status text := coalesce(p_product ->> 'status', 'draft');
begin
  if v_tenant_id is null then raise exception 'tenant_not_found'; end if;
  if not public.is_tenant_staff(v_tenant_id) then raise exception 'forbidden: tenant_staff_required'; end if;
  if jsonb_typeof(p_product) <> 'object' then raise exception 'invalid_product: product_required'; end if;
  if v_name is null or length(v_name) > 160 or v_slug is null or length(v_slug) > 180 or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid_product: name_and_slug_required'; end if;
  if length(v_description) > 4000 or coalesce(length(v_category_name), 0) > 100 or coalesce(length(v_brand_name), 0) > 100 then raise exception 'invalid_product: field_too_long'; end if;
  if v_status not in ('draft', 'published', 'archived') then raise exception 'invalid_product: status'; end if;
  if jsonb_typeof(p_variants) <> 'array' or jsonb_array_length(p_variants) = 0 or jsonb_array_length(p_variants) > 50 then raise exception 'invalid_product: variants_limit'; end if;

  if v_category_name is not null then
    select id into v_category_id from public.categories where tenant_id = v_tenant_id and lower(name) = lower(v_category_name) limit 1;
    if v_category_id is null then insert into public.categories(tenant_id, name, slug) values(v_tenant_id, v_category_name, v_slug || '-categoria') returning id into v_category_id; end if;
  end if;
  if v_brand_name is not null then
    select id into v_brand_id from public.brands where tenant_id = v_tenant_id and lower(name) = lower(v_brand_name) limit 1;
    if v_brand_id is null then insert into public.brands(tenant_id, name, slug) values(v_tenant_id, v_brand_name, v_slug || '-marca') returning id into v_brand_id; end if;
  end if;

  insert into public.products(tenant_id, slug, name, description, status, brand_id, primary_category_id, published_at)
  values(v_tenant_id, v_slug, v_name, v_description, v_status::public.product_status, v_brand_id, v_category_id, case when v_status = 'published' then timezone('utc', now()) end)
  returning id into v_product_id;
  if v_category_id is not null then insert into public.product_categories(product_id, category_id) values(v_product_id, v_category_id) on conflict do nothing; end if;

  for v_variant in select * from jsonb_to_recordset(p_variants) as x(name text, sku text, sale_price_cents integer, compare_at_price_cents integer, stock integer, condition_label text, is_presale boolean)
  loop
    if nullif(btrim(coalesce(v_variant.name, '')), '') is null or length(v_variant.name) > 160 or coalesce(length(v_variant.sku), 0) > 100 or coalesce(length(v_variant.condition_label), 0) > 50 then raise exception 'invalid_variant: text'; end if;
    if coalesce(v_variant.sale_price_cents, -1) < 0 or v_variant.sale_price_cents > 100000000 or coalesce(v_variant.stock, -1) < 0 or v_variant.stock > 1000000 or (v_variant.compare_at_price_cents is not null and (v_variant.compare_at_price_cents < v_variant.sale_price_cents or v_variant.compare_at_price_cents > 100000000)) then raise exception 'invalid_variant: price_or_stock'; end if;
    insert into public.product_variants(tenant_id, product_id, sku, name, condition_label, sale_price_cents, compare_at_price_cents, is_active, is_presale)
    values(v_tenant_id, v_product_id, coalesce(nullif(btrim(v_variant.sku), ''), 'SKU-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))), v_variant.name, coalesce(nullif(btrim(v_variant.condition_label), ''), 'Nuevo'), v_variant.sale_price_cents, v_variant.compare_at_price_cents, true, coalesce(v_variant.is_presale, false))
    returning id into v_variant_id;
    insert into public.inventory_items(variant_id, current_stock, reorder_point) values(v_variant_id, v_variant.stock, 2);
    insert into public.inventory_movements(variant_id, delta_quantity, reason, note, created_by) values(v_variant_id, v_variant.stock, 'manual_adjustment', 'Stock inicial al crear producto', auth.uid());
  end loop;
  insert into public.audit_log(tenant_id, entity_type, entity_id, action, payload, actor_user_id) values(v_tenant_id, 'product', v_product_id, 'created', jsonb_build_object('name', v_name), auth.uid());
  return jsonb_build_object('productId', v_product_id, 'slug', v_slug);
end;
$$;
revoke all on function public.tenant_create_product(text, jsonb, jsonb) from public;
grant execute on function public.tenant_create_product(text, jsonb, jsonb) to authenticated;
