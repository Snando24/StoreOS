-- Complete the tenant product CRUD without physical deletion. Variant removals
-- are deactivated to keep fulfilled orders and inventory history intact.

create or replace function public.tenant_get_product_detail(
  p_tenant_slug text,
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_tenant_id uuid := public.get_tenant_id_by_slug(p_tenant_slug); v_result jsonb;
begin
  if v_tenant_id is null then raise exception 'tenant_not_found'; end if;
  if not public.is_tenant_staff(v_tenant_id) then raise exception 'forbidden: tenant_staff_required'; end if;

  select jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'description', p.description,
    'status', p.status,
    'categoryName', c.name,
    'brandName', b.name,
    'variants', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pv.id,
        'name', pv.name,
        'salePriceCents', pv.sale_price_cents,
        'compareAtPriceCents', pv.compare_at_price_cents,
        'stock', ii.current_stock,
        'conditionLabel', pv.condition_label,
        'isPresale', pv.is_presale
      ) order by pv.created_at)
      from public.product_variants pv
      join public.inventory_items ii on ii.variant_id = pv.id
      where pv.product_id = p.id and pv.tenant_id = p.tenant_id and pv.is_active
    ), '[]'::jsonb)
  ) into v_result
  from public.products p
  left join public.categories c on c.id = p.primary_category_id and c.tenant_id = p.tenant_id
  left join public.brands b on b.id = p.brand_id and b.tenant_id = p.tenant_id
  where p.id = p_product_id and p.tenant_id = v_tenant_id;

  if v_result is null then raise exception 'product_not_found'; end if;
  return v_result;
end;
$$;

create or replace function public.tenant_update_product(
  p_tenant_slug text,
  p_product_id uuid,
  p_product jsonb,
  p_variants jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid := public.get_tenant_id_by_slug(p_tenant_slug);
  v_product_slug text;
  v_category_id uuid;
  v_brand_id uuid;
  v_variant record;
  v_variant_id uuid;
  v_current_stock integer;
  v_reserved_stock integer;
  v_seen_variant_ids uuid[] := '{}'::uuid[];
  v_name text := nullif(btrim(coalesce(p_product ->> 'name', '')), '');
  v_description text := coalesce(p_product ->> 'description', '');
  v_category_name text := nullif(btrim(coalesce(p_product ->> 'categoryName', '')), '');
  v_brand_name text := nullif(btrim(coalesce(p_product ->> 'brandName', '')), '');
  v_status text := coalesce(p_product ->> 'status', 'draft');
begin
  if v_tenant_id is null then raise exception 'tenant_not_found'; end if;
  if not public.is_tenant_staff(v_tenant_id) then raise exception 'forbidden: tenant_staff_required'; end if;
  if jsonb_typeof(p_product) <> 'object' or jsonb_typeof(p_variants) <> 'array' then raise exception 'invalid_product: payload_required'; end if;
  if v_name is null or length(v_name) > 160 or length(v_description) > 4000 or coalesce(length(v_category_name), 0) > 100 or coalesce(length(v_brand_name), 0) > 100 then raise exception 'invalid_product: field_too_long'; end if;
  if v_status not in ('draft', 'published', 'archived') then raise exception 'invalid_product: status'; end if;
  if jsonb_array_length(p_variants) = 0 or jsonb_array_length(p_variants) > 50 then raise exception 'invalid_product: variants_limit'; end if;

  select slug into v_product_slug from public.products where id = p_product_id and tenant_id = v_tenant_id for update;
  if v_product_slug is null then raise exception 'product_not_found'; end if;

  if v_category_name is not null then
    select id into v_category_id from public.categories where tenant_id = v_tenant_id and lower(name) = lower(v_category_name) limit 1;
    if v_category_id is null then
      insert into public.categories(tenant_id, name, slug)
      values (v_tenant_id, v_category_name, v_product_slug || '-cat-' || substr(md5(lower(v_category_name)), 1, 8))
      returning id into v_category_id;
    end if;
  end if;
  if v_brand_name is not null then
    select id into v_brand_id from public.brands where tenant_id = v_tenant_id and lower(name) = lower(v_brand_name) limit 1;
    if v_brand_id is null then
      insert into public.brands(tenant_id, name, slug)
      values (v_tenant_id, v_brand_name, v_product_slug || '-brand-' || substr(md5(lower(v_brand_name)), 1, 8))
      returning id into v_brand_id;
    end if;
  end if;

  update public.products
  set name = v_name, description = v_description, status = v_status::public.product_status,
      brand_id = v_brand_id, primary_category_id = v_category_id,
      published_at = case when v_status = 'published' then coalesce(published_at, timezone('utc', now())) else null end
  where id = p_product_id and tenant_id = v_tenant_id;
  delete from public.product_categories where product_id = p_product_id;
  if v_category_id is not null then
    insert into public.product_categories(product_id, category_id) values(p_product_id, v_category_id) on conflict do nothing;
  end if;

  for v_variant in select * from jsonb_to_recordset(p_variants) as x(id uuid, name text, sale_price_cents integer, compare_at_price_cents integer, stock integer, condition_label text, is_presale boolean)
  loop
    if nullif(btrim(coalesce(v_variant.name, '')), '') is null or length(v_variant.name) > 160 or coalesce(length(v_variant.condition_label), 0) > 50 then raise exception 'invalid_variant: text'; end if;
    if coalesce(v_variant.sale_price_cents, -1) < 0 or v_variant.sale_price_cents > 100000000 or coalesce(v_variant.stock, -1) < 0 or v_variant.stock > 1000000 or (v_variant.compare_at_price_cents is not null and (v_variant.compare_at_price_cents < v_variant.sale_price_cents or v_variant.compare_at_price_cents > 100000000)) then raise exception 'invalid_variant: price_or_stock'; end if;

    if v_variant.id is null then
      insert into public.product_variants(tenant_id, product_id, sku, name, condition_label, sale_price_cents, compare_at_price_cents, is_active, is_presale)
      values(v_tenant_id, p_product_id, 'SKU-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)), v_variant.name, coalesce(nullif(btrim(v_variant.condition_label), ''), 'Nuevo'), v_variant.sale_price_cents, v_variant.compare_at_price_cents, true, coalesce(v_variant.is_presale, false))
      returning id into v_variant_id;
      insert into public.inventory_items(variant_id, current_stock, reorder_point) values(v_variant_id, v_variant.stock, 2);
      insert into public.inventory_movements(variant_id, delta_quantity, reason, note, created_by) values(v_variant_id, v_variant.stock, 'manual_adjustment', 'Stock inicial al editar producto', auth.uid());
    else
      select ii.current_stock, ii.reserved_stock into v_current_stock, v_reserved_stock
      from public.product_variants pv join public.inventory_items ii on ii.variant_id = pv.id
      where pv.id = v_variant.id and pv.product_id = p_product_id and pv.tenant_id = v_tenant_id for update;
      if not found then raise exception 'variant_not_found'; end if;
      if v_variant.stock < v_reserved_stock then raise exception 'invalid_variant: stock_below_reserved'; end if;
      update public.product_variants
      set name = v_variant.name, condition_label = coalesce(nullif(btrim(v_variant.condition_label), ''), 'Nuevo'), sale_price_cents = v_variant.sale_price_cents,
          compare_at_price_cents = v_variant.compare_at_price_cents, is_active = true, is_presale = coalesce(v_variant.is_presale, false)
      where id = v_variant.id;
      update public.inventory_items set current_stock = v_variant.stock where variant_id = v_variant.id;
      if v_variant.stock <> v_current_stock then
        insert into public.inventory_movements(variant_id, delta_quantity, reason, note, created_by)
        values(v_variant.id, v_variant.stock - v_current_stock, 'manual_adjustment', 'Ajuste desde edición de producto', auth.uid());
      end if;
      v_variant_id := v_variant.id;
    end if;
    v_seen_variant_ids := array_append(v_seen_variant_ids, v_variant_id);
  end loop;

  update public.product_variants set is_active = false
  where product_id = p_product_id and tenant_id = v_tenant_id and not (id = any(v_seen_variant_ids));

  insert into public.audit_log(tenant_id, entity_type, entity_id, action, payload, actor_user_id)
  values(v_tenant_id, 'product', p_product_id, 'updated', jsonb_build_object('status', v_status, 'variantCount', jsonb_array_length(p_variants)), auth.uid());
end;
$$;

revoke all on function public.tenant_get_product_detail(text, uuid) from public;
revoke all on function public.tenant_update_product(text, uuid, jsonb, jsonb) from public;
grant execute on function public.tenant_get_product_detail(text, uuid) to authenticated;
grant execute on function public.tenant_update_product(text, uuid, jsonb, jsonb) to authenticated;
