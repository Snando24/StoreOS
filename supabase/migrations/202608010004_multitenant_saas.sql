-- SaaS foundation: every business is an isolated tenant/store.
-- Existing single-store data is migrated to the default `animegeek` tenant.

create type public.tenant_status as enum ('active', 'suspended', 'archived');

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  status public.tenant_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  store_name text not null,
  order_prefix text not null default 'ORD',
  currency_code text not null default 'PEN',
  shipping_flat_fee_cents integer not null default 0 check (shipping_flat_fee_cents >= 0),
  reserve_window_minutes integer not null default 30 check (reserve_window_minutes between 5 and 240),
  whatsapp_number text,
  logo_url text,
  primary_color text not null default '#8B5CF6',
  secondary_color text not null default '#22D3EE',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  hostname citext not null unique,
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'operator')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (tenant_id, user_id)
);

create table if not exists public.product_attribute_definitions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  attribute_key text not null check (attribute_key ~ '^[a-z][a-z0-9_]*$'),
  label text not null,
  data_type text not null check (data_type in ('text', 'number', 'boolean', 'select', 'date')),
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, attribute_key)
);

create table if not exists public.product_attribute_values (
  product_id uuid not null references public.products(id) on delete cascade,
  definition_id uuid not null references public.product_attribute_definitions(id) on delete cascade,
  value jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (product_id, definition_id)
);

insert into public.tenants (slug, name)
values ('animegeek', 'AnimeGeek')
on conflict (slug) do nothing;

insert into public.tenant_settings (
  tenant_id, store_name, order_prefix, currency_code, shipping_flat_fee_cents,
  reserve_window_minutes, whatsapp_number
)
select t.id, s.store_name, s.order_prefix, s.currency_code, s.shipping_flat_fee_cents,
       s.reserve_window_minutes, s.whatsapp_number
from public.tenants t
cross join public.store_settings s
where t.slug = 'animegeek' and s.id = true
on conflict (tenant_id) do nothing;

alter table public.brands add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.categories add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.franchises add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.products add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.product_variants add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.product_images add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.customers add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.orders add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.audit_log add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

do $$
declare v_default_tenant_id uuid;
begin
  select id into v_default_tenant_id from public.tenants where slug = 'animegeek';
  update public.brands set tenant_id = v_default_tenant_id where tenant_id is null;
  update public.categories set tenant_id = v_default_tenant_id where tenant_id is null;
  update public.franchises set tenant_id = v_default_tenant_id where tenant_id is null;
  update public.products set tenant_id = v_default_tenant_id where tenant_id is null;
  update public.product_variants pv set tenant_id = p.tenant_id from public.products p where pv.product_id = p.id and pv.tenant_id is null;
  update public.product_images pi set tenant_id = p.tenant_id from public.products p where pi.product_id = p.id and pi.tenant_id is null;
  update public.customers set tenant_id = v_default_tenant_id where tenant_id is null;
  update public.orders set tenant_id = v_default_tenant_id where tenant_id is null;
  update public.audit_log set tenant_id = v_default_tenant_id where tenant_id is null;
end $$;

alter table public.brands alter column tenant_id set not null;
alter table public.categories alter column tenant_id set not null;
alter table public.franchises alter column tenant_id set not null;
alter table public.products alter column tenant_id set not null;
alter table public.product_variants alter column tenant_id set not null;
alter table public.product_images alter column tenant_id set not null;
alter table public.customers alter column tenant_id set not null;
alter table public.orders alter column tenant_id set not null;
alter table public.audit_log alter column tenant_id set not null;

alter table public.brands drop constraint if exists brands_slug_key;
alter table public.categories drop constraint if exists categories_slug_key;
alter table public.franchises drop constraint if exists franchises_slug_key;
alter table public.products drop constraint if exists products_slug_key;
alter table public.product_variants drop constraint if exists product_variants_sku_key;
alter table public.orders drop constraint if exists orders_order_number_key;
alter table public.orders drop constraint if exists orders_idempotency_key_key;

create unique index if not exists brands_tenant_slug_key on public.brands(tenant_id, slug);
create unique index if not exists categories_tenant_slug_key on public.categories(tenant_id, slug);
create unique index if not exists franchises_tenant_slug_key on public.franchises(tenant_id, slug);
create unique index if not exists products_tenant_slug_key on public.products(tenant_id, slug);
create unique index if not exists product_variants_tenant_sku_key on public.product_variants(tenant_id, sku);
create unique index if not exists orders_tenant_order_number_key on public.orders(tenant_id, order_number);
create unique index if not exists orders_tenant_idempotency_key_key on public.orders(tenant_id, idempotency_key);
create index if not exists idx_products_tenant_status_published on public.products(tenant_id, status, published_at desc);
create index if not exists idx_orders_tenant_status_created on public.orders(tenant_id, status, created_at desc);
create index if not exists idx_customers_tenant_phone on public.customers(tenant_id, phone);

create or replace function public.is_tenant_staff(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_memberships tm
    join public.tenants t on t.id = tm.tenant_id
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'admin', 'operator')
      and t.status = 'active'
  );
$$;

create or replace function public.is_tenant_owner(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_memberships tm
    where tm.tenant_id = p_tenant_id and tm.user_id = auth.uid() and tm.role = 'owner'
  );
$$;

create or replace function public.get_tenant_id_by_slug(p_tenant_slug text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.tenants
  where slug = lower(btrim(p_tenant_slug)) and status = 'active';
$$;

create or replace function public.generate_tenant_order_number(p_tenant_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_prefix text; v_sequence bigint;
begin
  select order_prefix into v_prefix from public.tenant_settings where tenant_id = p_tenant_id;
  if v_prefix is null then raise exception 'tenant_not_configured'; end if;
  v_sequence := nextval('public.order_number_seq');
  return format('%s-%s-%s', v_prefix, to_char(timezone('utc', now()), 'YYYY'), lpad(v_sequence::text, 6, '0'));
end;
$$;

-- Rebuild the public projection. The client must filter by tenant_slug (or resolve it from host).
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
    select pi.public_url from public.product_images pi
    where pi.product_id = p.id and pi.tenant_id = p.tenant_id
    order by pi.is_primary desc, pi.sort_order asc limit 1
  ) as primary_image_url
from public.products p
join public.tenants t on t.id = p.tenant_id and t.status = 'active'
join public.product_variants pv on pv.product_id = p.id and pv.tenant_id = p.tenant_id and pv.is_active
join public.inventory_items ii on ii.variant_id = pv.id and ii.is_active
left join public.brands b on b.id = p.brand_id and b.tenant_id = p.tenant_id
left join public.categories c on c.id = p.primary_category_id and c.tenant_id = p.tenant_id
left join public.franchises f on f.id = p.primary_franchise_id and f.tenant_id = p.tenant_id
where p.status = 'published';
grant select on public.catalog_products to anon, authenticated;

-- Replace single-store policies with tenant scoped policies.
drop policy if exists products_public_read on public.products;
drop policy if exists staff_manage_catalog on public.products;
create policy products_public_read on public.products for select to anon, authenticated using (status = 'published');
create policy tenant_manage_products on public.products for all to authenticated
  using (public.is_tenant_staff(tenant_id)) with check (public.is_tenant_staff(tenant_id));

drop policy if exists variants_public_read on public.product_variants;
drop policy if exists staff_manage_variants on public.product_variants;
create policy variants_public_read on public.product_variants for select to anon, authenticated
  using (is_active and exists (select 1 from public.products p where p.id = product_variants.product_id and p.status = 'published'));
create policy tenant_manage_variants on public.product_variants for all to authenticated
  using (public.is_tenant_staff(tenant_id)) with check (public.is_tenant_staff(tenant_id));

drop policy if exists images_public_read on public.product_images;
drop policy if exists staff_manage_images on public.product_images;
create policy images_public_read on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_images.product_id and p.status = 'published'));
create policy tenant_manage_images on public.product_images for all to authenticated
  using (public.is_tenant_staff(tenant_id)) with check (public.is_tenant_staff(tenant_id));

drop policy if exists brands_public_read on public.brands;
drop policy if exists staff_manage_brands on public.brands;
create policy brands_public_read on public.brands for select to anon, authenticated using (true);
create policy tenant_manage_brands on public.brands for all to authenticated using (public.is_tenant_staff(tenant_id)) with check (public.is_tenant_staff(tenant_id));

drop policy if exists categories_public_read on public.categories;
drop policy if exists staff_manage_categories on public.categories;
create policy categories_public_read on public.categories for select to anon, authenticated using (is_active);
create policy tenant_manage_categories on public.categories for all to authenticated using (public.is_tenant_staff(tenant_id)) with check (public.is_tenant_staff(tenant_id));

drop policy if exists franchises_public_read on public.franchises;
drop policy if exists staff_manage_franchises on public.franchises;
create policy franchises_public_read on public.franchises for select to anon, authenticated using (is_active);
create policy tenant_manage_franchises on public.franchises for all to authenticated using (public.is_tenant_staff(tenant_id)) with check (public.is_tenant_staff(tenant_id));

drop policy if exists staff_read_inventory on public.inventory_items;
drop policy if exists staff_read_customers on public.customers;
drop policy if exists staff_read_orders on public.orders;
drop policy if exists staff_read_order_items on public.order_items;
drop policy if exists staff_read_order_history on public.order_status_history;
drop policy if exists staff_read_payment_attempts on public.payment_attempts;
drop policy if exists staff_read_inventory_reservations on public.inventory_reservations;
drop policy if exists staff_read_inventory_movements on public.inventory_movements;
drop policy if exists staff_read_audit_log on public.audit_log;

create policy tenant_read_inventory on public.inventory_items for select to authenticated
  using (exists (select 1 from public.product_variants pv where pv.id = inventory_items.variant_id and public.is_tenant_staff(pv.tenant_id)));
create policy tenant_read_customers on public.customers for select to authenticated using (public.is_tenant_staff(tenant_id));
create policy tenant_read_orders on public.orders for select to authenticated using (public.is_tenant_staff(tenant_id));
create policy tenant_read_order_items on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and public.is_tenant_staff(o.tenant_id)));
create policy tenant_read_order_history on public.order_status_history for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_status_history.order_id and public.is_tenant_staff(o.tenant_id)));
create policy tenant_read_payment_attempts on public.payment_attempts for select to authenticated
  using (exists (select 1 from public.orders o where o.id = payment_attempts.order_id and public.is_tenant_staff(o.tenant_id)));
create policy tenant_read_inventory_reservations on public.inventory_reservations for select to authenticated
  using (exists (select 1 from public.orders o where o.id = inventory_reservations.order_id and public.is_tenant_staff(o.tenant_id)));
create policy tenant_read_inventory_movements on public.inventory_movements for select to authenticated
  using (exists (select 1 from public.product_variants pv where pv.id = inventory_movements.variant_id and public.is_tenant_staff(pv.tenant_id)));
create policy tenant_read_audit_log on public.audit_log for select to authenticated using (public.is_tenant_staff(tenant_id));

alter table public.tenants enable row level security;
alter table public.tenant_settings enable row level security;
alter table public.tenant_domains enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.product_attribute_definitions enable row level security;
alter table public.product_attribute_values enable row level security;

create policy tenants_public_read on public.tenants for select to anon, authenticated using (status = 'active');
create policy tenant_settings_public_read on public.tenant_settings for select to anon, authenticated using (true);
create policy tenant_memberships_self_read on public.tenant_memberships for select to authenticated using (user_id = auth.uid());
create policy tenant_memberships_staff_read on public.tenant_memberships for select to authenticated using (public.is_tenant_staff(tenant_id));
create policy tenant_memberships_owner_manage on public.tenant_memberships for all to authenticated
  using (public.is_tenant_owner(tenant_id))
  with check (public.is_tenant_owner(tenant_id));
create policy tenant_settings_manage on public.tenant_settings for all to authenticated using (public.is_tenant_staff(tenant_id)) with check (public.is_tenant_staff(tenant_id));
create policy tenant_domains_manage on public.tenant_domains for all to authenticated using (public.is_tenant_staff(tenant_id)) with check (public.is_tenant_staff(tenant_id));
create policy tenant_attribute_definitions_manage on public.product_attribute_definitions for all to authenticated using (public.is_tenant_staff(tenant_id)) with check (public.is_tenant_staff(tenant_id));
create policy tenant_attribute_values_manage on public.product_attribute_values for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_attribute_values.product_id and public.is_tenant_staff(p.tenant_id)))
  with check (exists (select 1 from public.products p where p.id = product_attribute_values.product_id and public.is_tenant_staff(p.tenant_id)));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email), new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

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
declare v_tenant_id uuid;
begin
  if auth.uid() is null then raise exception 'forbidden: authentication_required'; end if;
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
revoke all on function public.provision_tenant(text, text, text) from public;
grant execute on function public.provision_tenant(text, text, text) to authenticated;

-- Product imagery is public only once a product is published. Writes are isolated
-- to the tenant prefix: {tenant_uuid}/products/{product_uuid}/filename.
insert into storage.buckets (id, name, public)
values ('tenant-assets', 'tenant-assets', true)
on conflict (id) do update set public = excluded.public;

create or replace function public.can_manage_tenant_asset(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when split_part(p_object_name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.is_tenant_staff(split_part(p_object_name, '/', 1)::uuid)
    else false
  end;
$$;

drop policy if exists tenant_assets_insert on storage.objects;
drop policy if exists tenant_assets_update on storage.objects;
drop policy if exists tenant_assets_delete on storage.objects;
create policy tenant_assets_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'tenant-assets' and public.can_manage_tenant_asset(name));
create policy tenant_assets_update on storage.objects for update to authenticated
  using (bucket_id = 'tenant-assets' and public.can_manage_tenant_asset(name))
  with check (bucket_id = 'tenant-assets' and public.can_manage_tenant_asset(name));
create policy tenant_assets_delete on storage.objects for delete to authenticated
  using (bucket_id = 'tenant-assets' and public.can_manage_tenant_asset(name));

-- Tenant-aware checkout. Prices and availability always come from the database.
create or replace function public.create_tenant_order(
  p_tenant_slug text,
  p_idempotency_key text,
  p_customer jsonb,
  p_delivery jsonb,
  p_payment jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_tenant_id_by_slug(p_tenant_slug);
  v_existing public.orders%rowtype;
  v_customer_id uuid; v_order_id uuid; v_order_number text; v_expires_at timestamptz;
  v_shipping integer := 0; v_subtotal integer := 0; v_item record; v_variant record;
  v_items jsonb := '[]'::jsonb; v_reservation_id uuid; v_whatsapp text; v_name text; v_phone text; v_email citext;
begin
  if v_tenant_id is null then raise exception 'tenant_not_found'; end if;
  if coalesce(btrim(p_idempotency_key), '') = '' or length(p_idempotency_key) > 200 then raise exception 'invalid_request: idempotency_key_required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'invalid_items: empty_cart'; end if;

  select * into v_existing from public.orders where tenant_id = v_tenant_id and idempotency_key = p_idempotency_key;
  if found then
    select whatsapp_number into v_whatsapp from public.tenant_settings where tenant_id = v_tenant_id;
    return jsonb_build_object('orderId', v_existing.id, 'orderNumber', v_existing.order_number, 'status', v_existing.status, 'paymentStatus', v_existing.payment_status, 'totalCents', v_existing.total_cents, 'reserveExpiresAt', v_existing.reserve_expires_at, 'whatsappNumber', v_whatsapp, 'whatsappMessage', format('Hola, quiero confirmar el pedido %s.', v_existing.order_number));
  end if;

  v_name := nullif(btrim(coalesce(p_customer ->> 'name', '')), '');
  v_phone := nullif(regexp_replace(coalesce(p_customer ->> 'phone', ''), '\\D', '', 'g'), '');
  v_email := nullif(btrim(coalesce(p_customer ->> 'email', '')), '')::citext;
  if v_name is null or v_phone is null or length(v_phone) not between 9 and 15 then raise exception 'invalid_customer: name_and_phone_required'; end if;
  if coalesce(p_delivery ->> 'method', 'shipping') = 'shipping' and (nullif(btrim(coalesce(p_delivery ->> 'address', '')), '') is null or nullif(btrim(coalesce(p_delivery ->> 'district', '')), '') is null) then raise exception 'invalid_delivery: address_and_district_required'; end if;

  select case when coalesce(p_delivery ->> 'method', 'shipping') = 'pickup' then 0 else shipping_flat_fee_cents end,
         timezone('utc', now()) + make_interval(mins => reserve_window_minutes), whatsapp_number
  into v_shipping, v_expires_at, v_whatsapp from public.tenant_settings where tenant_id = v_tenant_id;

  for v_item in select variant_id, sum(quantity)::integer quantity from jsonb_to_recordset(p_items) as x(variant_id uuid, quantity integer) group by variant_id order by variant_id
  loop
    if v_item.variant_id is null or v_item.quantity is null or v_item.quantity <= 0 then raise exception 'invalid_items: quantity_must_be_positive'; end if;
    select pv.id, pv.product_id, pv.name variant_name, pv.sku, pv.sale_price_cents, pv.is_active, p.name product_name, p.status product_status, ii.current_stock, ii.reserved_stock
    into v_variant from public.product_variants pv join public.products p on p.id = pv.product_id join public.inventory_items ii on ii.variant_id = pv.id and ii.is_active
    where pv.id = v_item.variant_id and pv.tenant_id = v_tenant_id and p.tenant_id = v_tenant_id for update of pv, ii;
    if not found or v_variant.product_status <> 'published' or not v_variant.is_active then raise exception 'product_unavailable: variant_not_sellable'; end if;
    if v_variant.current_stock - v_variant.reserved_stock < v_item.quantity then raise exception 'out_of_stock: insufficient_available_stock'; end if;
    v_subtotal := v_subtotal + v_variant.sale_price_cents * v_item.quantity;
    v_items := v_items || jsonb_build_array(jsonb_build_object('variantId', v_variant.id, 'productId', v_variant.product_id, 'productName', v_variant.product_name, 'variantName', v_variant.variant_name, 'sku', v_variant.sku, 'unitPriceCents', v_variant.sale_price_cents, 'quantity', v_item.quantity));
  end loop;

  select id into v_customer_id from public.customers where tenant_id = v_tenant_id and ((v_email is not null and email = v_email) or (v_phone is not null and phone = v_phone)) order by updated_at desc limit 1;
  if v_customer_id is null then insert into public.customers(tenant_id, email, full_name, phone, document_number) values(v_tenant_id, v_email, v_name, v_phone, nullif(btrim(coalesce(p_customer ->> 'documentNumber', '')), '')) returning id into v_customer_id;
  else update public.customers set email = coalesce(v_email, email), full_name = v_name, phone = v_phone where id = v_customer_id; end if;

  v_order_number := public.generate_tenant_order_number(v_tenant_id);
  insert into public.orders(tenant_id, order_number, customer_id, payment_method, subtotal_cents, shipping_cents, total_cents, delivery_method, delivery_address, delivery_district, customer_note, idempotency_key, reserve_expires_at)
  values(v_tenant_id, v_order_number, v_customer_id, coalesce(nullif(btrim(coalesce(p_payment ->> 'method', '')), ''), 'manual_review'), v_subtotal, v_shipping, v_subtotal + v_shipping, coalesce((p_delivery ->> 'method')::public.delivery_method, 'shipping'), nullif(btrim(coalesce(p_delivery ->> 'address', '')), ''), nullif(btrim(coalesce(p_delivery ->> 'district', '')), ''), nullif(btrim(coalesce(p_customer ->> 'note', '')), ''), p_idempotency_key, v_expires_at) returning id into v_order_id;
  insert into public.order_status_history(order_id, to_status, reason) values(v_order_id, 'pending_payment', 'Pedido creado con reserva temporal');
  insert into public.payment_attempts(order_id, provider, amount_cents) values(v_order_id, coalesce(nullif(btrim(coalesce(p_payment ->> 'method', '')), ''), 'manual_review'), v_subtotal + v_shipping);

  for v_item in select value from jsonb_array_elements(v_items) loop
    insert into public.order_items(order_id, variant_id, product_id, product_name_snapshot, variant_name_snapshot, sku_snapshot, unit_price_cents, quantity, line_total_cents)
    values(v_order_id, (v_item.value ->> 'variantId')::uuid, (v_item.value ->> 'productId')::uuid, v_item.value ->> 'productName', v_item.value ->> 'variantName', v_item.value ->> 'sku', (v_item.value ->> 'unitPriceCents')::integer, (v_item.value ->> 'quantity')::integer, (v_item.value ->> 'unitPriceCents')::integer * (v_item.value ->> 'quantity')::integer);
    insert into public.inventory_reservations(variant_id, order_id, quantity, expires_at) values((v_item.value ->> 'variantId')::uuid, v_order_id, (v_item.value ->> 'quantity')::integer, v_expires_at) returning id into v_reservation_id;
    update public.inventory_items set reserved_stock = reserved_stock + (v_item.value ->> 'quantity')::integer where variant_id = (v_item.value ->> 'variantId')::uuid;
    insert into public.inventory_movements(variant_id, order_id, reservation_id, delta_quantity, reason, note) values((v_item.value ->> 'variantId')::uuid, v_order_id, v_reservation_id, -((v_item.value ->> 'quantity')::integer), 'reservation_created', 'Reserva creada durante checkout');
  end loop;
  insert into public.audit_log(tenant_id, entity_type, entity_id, action, payload) values(v_tenant_id, 'order', v_order_id, 'created', jsonb_build_object('orderNumber', v_order_number));
  return jsonb_build_object('orderId', v_order_id, 'orderNumber', v_order_number, 'status', 'pending_payment', 'paymentStatus', 'pending', 'totalCents', v_subtotal + v_shipping, 'reserveExpiresAt', v_expires_at, 'whatsappNumber', v_whatsapp, 'whatsappMessage', format('Hola, quiero confirmar el pedido %s.', v_order_number));
end;
$$;

revoke all on function public.create_tenant_order(text, text, jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function public.create_tenant_order(text, text, jsonb, jsonb, jsonb, jsonb) to anon, authenticated;
revoke all on function public.create_order(text, jsonb, jsonb, jsonb, jsonb) from anon, authenticated;

create or replace function public.tenant_confirm_manual_payment(p_order_id uuid, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype; v_reservation record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'not_found: order'; end if;
  if not public.is_tenant_staff(v_order.tenant_id) then raise exception 'forbidden: tenant_staff_required'; end if;
  if v_order.status <> 'pending_payment' or v_order.reserve_expires_at <= timezone('utc', now()) then raise exception 'invalid_transition: payment_cannot_be_confirmed'; end if;
  for v_reservation in select * from public.inventory_reservations where order_id = v_order.id and status = 'active' order by variant_id for update loop
    update public.inventory_items set current_stock = current_stock - v_reservation.quantity, reserved_stock = reserved_stock - v_reservation.quantity
    where variant_id = v_reservation.variant_id and current_stock >= v_reservation.quantity and reserved_stock >= v_reservation.quantity;
    if not found then raise exception 'inventory_inconsistent: cannot_confirm_order'; end if;
    update public.inventory_reservations set status = 'converted', converted_at = timezone('utc', now()) where id = v_reservation.id;
    insert into public.inventory_movements(variant_id, order_id, reservation_id, delta_quantity, reason, note, created_by)
    values(v_reservation.variant_id, v_order.id, v_reservation.id, 0, 'sale_confirmed', coalesce(p_note, 'Pago manual confirmado'), auth.uid());
  end loop;
  update public.orders set status = 'paid', payment_status = 'confirmed' where id = v_order.id;
  update public.payment_attempts set status = 'confirmed', metadata = metadata || jsonb_build_object('confirmedBy', auth.uid(), 'note', p_note) where order_id = v_order.id and status in ('pending', 'submitted_for_review');
  insert into public.order_status_history(order_id, from_status, to_status, reason, actor_user_id) values(v_order.id, 'pending_payment', 'paid', coalesce(p_note, 'Pago manual confirmado'), auth.uid());
  insert into public.audit_log(tenant_id, entity_type, entity_id, action, payload, actor_user_id) values(v_order.tenant_id, 'order', v_order.id, 'payment_confirmed', jsonb_build_object('note', p_note), auth.uid());
  return jsonb_build_object('orderId', v_order.id, 'status', 'paid', 'paymentStatus', 'confirmed');
end; $$;

create or replace function public.tenant_advance_order(p_order_id uuid, p_to_status public.order_status, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype; v_allowed boolean;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'not_found: order'; end if;
  if not public.is_tenant_staff(v_order.tenant_id) then raise exception 'forbidden: tenant_staff_required'; end if;
  v_allowed := (v_order.status = 'paid' and p_to_status = 'preparing') or (v_order.status = 'preparing' and p_to_status = 'shipped') or (v_order.status = 'shipped' and p_to_status = 'delivered');
  if not v_allowed then raise exception 'invalid_transition: unsupported_order_state'; end if;
  update public.orders set status = p_to_status where id = v_order.id;
  insert into public.order_status_history(order_id, from_status, to_status, reason, actor_user_id) values(v_order.id, v_order.status, p_to_status, p_note, auth.uid());
  return jsonb_build_object('orderId', v_order.id, 'status', p_to_status);
end; $$;

create or replace function public.tenant_cancel_pending_order(p_order_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype; v_reservation record;
begin
  if nullif(btrim(p_reason), '') is null then raise exception 'invalid_request: cancellation_reason_required'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'not_found: order'; end if;
  if not public.is_tenant_staff(v_order.tenant_id) then raise exception 'forbidden: tenant_staff_required'; end if;
  if v_order.status <> 'pending_payment' then raise exception 'invalid_transition: only_pending_orders_can_cancel'; end if;
  for v_reservation in select * from public.inventory_reservations where order_id = v_order.id and status = 'active' order by variant_id for update loop
    update public.inventory_reservations set status = 'released', released_at = timezone('utc', now()) where id = v_reservation.id;
    update public.inventory_items set reserved_stock = reserved_stock - v_reservation.quantity where variant_id = v_reservation.variant_id and reserved_stock >= v_reservation.quantity;
    if not found then raise exception 'inventory_inconsistent: cannot_release_reservation'; end if;
    insert into public.inventory_movements(variant_id, order_id, reservation_id, delta_quantity, reason, note, created_by) values(v_reservation.variant_id, v_order.id, v_reservation.id, v_reservation.quantity, 'reservation_released', p_reason, auth.uid());
  end loop;
  update public.orders set status = 'cancelled', payment_status = 'rejected' where id = v_order.id;
  update public.payment_attempts set status = 'rejected' where order_id = v_order.id and status in ('pending', 'submitted_for_review');
  insert into public.order_status_history(order_id, from_status, to_status, reason, actor_user_id) values(v_order.id, 'pending_payment', 'cancelled', p_reason, auth.uid());
  return jsonb_build_object('orderId', v_order.id, 'status', 'cancelled');
end; $$;

create or replace function public.tenant_adjust_inventory(p_variant_id uuid, p_delta_quantity integer, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_item record;
begin
  if p_delta_quantity = 0 or nullif(btrim(p_note), '') is null then raise exception 'invalid_request: adjustment_and_note_required'; end if;
  select ii.id, ii.current_stock, ii.reserved_stock, pv.tenant_id
  into v_item
  from public.inventory_items ii join public.product_variants pv on pv.id = ii.variant_id
  where ii.variant_id = p_variant_id for update of ii;
  if not found then raise exception 'not_found: inventory_item'; end if;
  if not public.is_tenant_staff(v_item.tenant_id) then raise exception 'forbidden: tenant_staff_required'; end if;
  if v_item.current_stock + p_delta_quantity < v_item.reserved_stock then raise exception 'invalid_adjustment: cannot_reduce_reserved_stock'; end if;
  update public.inventory_items set current_stock = current_stock + p_delta_quantity where id = v_item.id;
  insert into public.inventory_movements(variant_id, delta_quantity, reason, note, created_by) values(p_variant_id, p_delta_quantity, 'manual_adjustment', p_note, auth.uid());
  insert into public.audit_log(tenant_id, entity_type, entity_id, action, payload, actor_user_id) values(v_item.tenant_id, 'inventory_item', v_item.id, 'manual_adjustment', jsonb_build_object('deltaQuantity', p_delta_quantity, 'note', p_note), auth.uid());
  return jsonb_build_object('variantId', p_variant_id, 'currentStock', v_item.current_stock + p_delta_quantity);
end; $$;

revoke all on function public.confirm_manual_payment(uuid, text) from public, authenticated;
revoke all on function public.advance_order(uuid, public.order_status, text) from public, authenticated;
revoke all on function public.cancel_pending_order(uuid, text) from public, authenticated;
revoke all on function public.adjust_inventory(uuid, integer, text) from public, authenticated;
grant execute on function public.tenant_confirm_manual_payment(uuid, text) to authenticated;
grant execute on function public.tenant_advance_order(uuid, public.order_status, text) to authenticated;
grant execute on function public.tenant_cancel_pending_order(uuid, text) to authenticated;
grant execute on function public.tenant_adjust_inventory(uuid, integer, text) to authenticated;

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
begin
  if v_tenant_id is null then raise exception 'tenant_not_found'; end if;
  if not public.is_tenant_staff(v_tenant_id) then raise exception 'forbidden: tenant_staff_required'; end if;
  if v_name is null or v_slug is null or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid_product: name_and_slug_required'; end if;
  if jsonb_typeof(p_variants) <> 'array' or jsonb_array_length(p_variants) = 0 then raise exception 'invalid_product: at_least_one_variant_required'; end if;

  if v_category_name is not null then
    select id into v_category_id from public.categories where tenant_id = v_tenant_id and lower(name) = lower(v_category_name) limit 1;
    if v_category_id is null then
      insert into public.categories(tenant_id, name, slug) values(v_tenant_id, v_category_name, v_slug || '-categoria') returning id into v_category_id;
    end if;
  end if;
  if v_brand_name is not null then
    select id into v_brand_id from public.brands where tenant_id = v_tenant_id and lower(name) = lower(v_brand_name) limit 1;
    if v_brand_id is null then
      insert into public.brands(tenant_id, name, slug) values(v_tenant_id, v_brand_name, v_slug || '-marca') returning id into v_brand_id;
    end if;
  end if;

  insert into public.products(tenant_id, slug, name, description, status, brand_id, primary_category_id, published_at)
  values(v_tenant_id, v_slug, v_name, coalesce(p_product ->> 'description', ''), coalesce((p_product ->> 'status')::public.product_status, 'draft'), v_brand_id, v_category_id, case when coalesce(p_product ->> 'status', 'draft') = 'published' then timezone('utc', now()) end)
  returning id into v_product_id;

  if v_category_id is not null then insert into public.product_categories(product_id, category_id) values(v_product_id, v_category_id) on conflict do nothing; end if;
  for v_variant in select * from jsonb_to_recordset(p_variants) as x(name text, sku text, sale_price_cents integer, compare_at_price_cents integer, stock integer, condition_label text, is_presale boolean)
  loop
    if coalesce(v_variant.sale_price_cents, -1) < 0 or coalesce(v_variant.stock, -1) < 0 then raise exception 'invalid_variant: price_and_stock_required'; end if;
    insert into public.product_variants(tenant_id, product_id, sku, name, condition_label, sale_price_cents, compare_at_price_cents, is_active, is_presale)
    values(
      v_tenant_id,
      v_product_id,
      coalesce(nullif(btrim(v_variant.sku), ''), 'SKU-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
      v_variant.name,
      coalesce(nullif(btrim(v_variant.condition_label), ''), 'Nuevo'),
      v_variant.sale_price_cents,
      v_variant.compare_at_price_cents,
      true,
      coalesce(v_variant.is_presale, false)
    )
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
