-- Tenant-scoped product management. Products are archived instead of hard-deleted
-- so order history, inventory movements, and audit records remain verifiable.

create or replace function public.tenant_list_products(p_tenant_slug text)
returns table(
  id uuid,
  name text,
  description text,
  status text,
  category_name text,
  brand_name text,
  variant_count integer,
  total_stock integer,
  starting_price_cents integer,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare v_tenant_id uuid := public.get_tenant_id_by_slug(p_tenant_slug);
begin
  if v_tenant_id is null then raise exception 'tenant_not_found'; end if;
  if not public.is_tenant_staff(v_tenant_id) then raise exception 'forbidden: tenant_staff_required'; end if;

  return query
  select
    p.id,
    p.name,
    p.description,
    p.status::text,
    c.name,
    b.name,
    count(pv.id)::integer,
    coalesce(sum(ii.current_stock), 0)::integer,
    coalesce(min(pv.sale_price_cents), 0)::integer,
    p.updated_at
  from public.products p
  left join public.categories c on c.id = p.primary_category_id and c.tenant_id = p.tenant_id
  left join public.brands b on b.id = p.brand_id and b.tenant_id = p.tenant_id
  left join public.product_variants pv on pv.product_id = p.id and pv.tenant_id = p.tenant_id and pv.is_active
  left join public.inventory_items ii on ii.variant_id = pv.id and ii.is_active
  where p.tenant_id = v_tenant_id
  group by p.id, c.name, b.name
  order by p.updated_at desc;
end;
$$;

create or replace function public.tenant_set_product_status(
  p_tenant_slug text,
  p_product_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_tenant_id uuid := public.get_tenant_id_by_slug(p_tenant_slug);
begin
  if v_tenant_id is null then raise exception 'tenant_not_found'; end if;
  if not public.is_tenant_staff(v_tenant_id) then raise exception 'forbidden: tenant_staff_required'; end if;
  if p_status not in ('draft', 'published', 'archived') then raise exception 'invalid_product: status'; end if;

  update public.products
  set
    status = p_status::public.product_status,
    published_at = case
      when p_status = 'published' then coalesce(published_at, timezone('utc', now()))
      else null
    end
  where id = p_product_id and tenant_id = v_tenant_id;

  if not found then raise exception 'product_not_found'; end if;

  insert into public.audit_log(tenant_id, entity_type, entity_id, action, payload, actor_user_id)
  values (v_tenant_id, 'product', p_product_id, 'status_changed', jsonb_build_object('status', p_status), auth.uid());
end;
$$;

revoke all on function public.tenant_list_products(text) from public;
revoke all on function public.tenant_set_product_status(text, uuid, text) from public;
grant execute on function public.tenant_list_products(text) to authenticated;
grant execute on function public.tenant_set_product_status(text, uuid, text) to authenticated;
