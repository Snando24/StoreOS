-- Release 1: secure the catalog surface and centralize every inventory/order mutation.
-- These functions intentionally own stock mutations; clients must never update stock or
-- order lifecycle fields directly.

alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.franchises enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_franchises enable row level security;

create policy brands_public_read
on public.brands
for select
to anon, authenticated
using (true);

create policy categories_public_read
on public.categories
for select
to anon, authenticated
using (is_active = true);

create policy franchises_public_read
on public.franchises
for select
to anon, authenticated
using (is_active = true);

create policy product_categories_public_read
on public.product_categories
for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_categories.product_id and p.status = 'published'
  )
);

create policy product_franchises_public_read
on public.product_franchises
for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_franchises.product_id and p.status = 'published'
  )
);

create policy staff_manage_brands
on public.brands
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_categories
on public.categories
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_franchises
on public.franchises
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_product_categories
on public.product_categories
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_product_franchises
on public.product_franchises
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Staff can inspect operational records, but can only change them through the
-- commands below. This preserves the state machine and inventory ledger.
drop policy if exists staff_manage_inventory on public.inventory_items;
drop policy if exists staff_manage_customers on public.customers;
drop policy if exists staff_manage_orders on public.orders;
drop policy if exists staff_manage_order_items on public.order_items;
drop policy if exists staff_manage_order_history on public.order_status_history;
drop policy if exists staff_manage_payment_attempts on public.payment_attempts;
drop policy if exists staff_manage_inventory_reservations on public.inventory_reservations;
drop policy if exists staff_manage_inventory_movements on public.inventory_movements;
drop policy if exists staff_manage_audit_log on public.audit_log;

create policy staff_read_inventory
on public.inventory_items for select to authenticated
using (public.is_staff());

create policy staff_read_customers
on public.customers for select to authenticated
using (public.is_staff());

create policy staff_read_orders
on public.orders for select to authenticated
using (public.is_staff());

create policy staff_read_order_items
on public.order_items for select to authenticated
using (public.is_staff());

create policy staff_read_order_history
on public.order_status_history for select to authenticated
using (public.is_staff());

create policy staff_read_payment_attempts
on public.payment_attempts for select to authenticated
using (public.is_staff());

create policy staff_read_inventory_reservations
on public.inventory_reservations for select to authenticated
using (public.is_staff());

create policy staff_read_inventory_movements
on public.inventory_movements for select to authenticated
using (public.is_staff());

create policy staff_read_audit_log
on public.audit_log for select to authenticated
using (public.is_staff());

create or replace function public.create_order(
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
  v_existing_order public.orders%rowtype;
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_reserve_expires_at timestamptz;
  v_subtotal_cents integer := 0;
  v_shipping_cents integer := 0;
  v_total_cents integer := 0;
  v_customer_email citext;
  v_customer_phone text;
  v_customer_name text;
  v_delivery_method public.delivery_method;
  v_item record;
  v_variant record;
  v_normalized_items jsonb := '[]'::jsonb;
  v_reservation_id uuid;
  v_whatsapp_number text;
  v_whatsapp_message text;
begin
  if coalesce(btrim(p_idempotency_key), '') = '' or length(p_idempotency_key) > 200 then
    raise exception 'invalid_request: idempotency_key_required';
  end if;

  select * into v_existing_order
  from public.orders
  where idempotency_key = p_idempotency_key
  limit 1;

  if found then
    select whatsapp_number into v_whatsapp_number from public.store_settings where id = true;
    return jsonb_build_object(
      'orderId', v_existing_order.id,
      'orderNumber', v_existing_order.order_number,
      'status', v_existing_order.status,
      'paymentStatus', v_existing_order.payment_status,
      'totalCents', v_existing_order.total_cents,
      'reserveExpiresAt', v_existing_order.reserve_expires_at,
      'whatsappNumber', v_whatsapp_number,
      'whatsappMessage', format('Hola, quiero confirmar el pedido %s.', v_existing_order.order_number)
    );
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'invalid_items: empty_cart';
  end if;

  v_customer_name := nullif(btrim(coalesce(p_customer ->> 'name', '')), '');
  v_customer_phone := nullif(regexp_replace(coalesce(p_customer ->> 'phone', ''), '\\D', '', 'g'), '');
  v_customer_email := nullif(btrim(coalesce(p_customer ->> 'email', '')), '')::citext;
  v_delivery_method := coalesce((p_delivery ->> 'method')::public.delivery_method, 'shipping');

  if v_customer_name is null or v_customer_phone is null then
    raise exception 'invalid_customer: name_and_phone_required';
  end if;

  if length(v_customer_phone) < 9 or length(v_customer_phone) > 15 then
    raise exception 'invalid_customer: invalid_phone';
  end if;

  if v_delivery_method = 'shipping'
     and (nullif(btrim(coalesce(p_delivery ->> 'address', '')), '') is null
       or nullif(btrim(coalesce(p_delivery ->> 'district', '')), '') is null) then
    raise exception 'invalid_delivery: address_and_district_required';
  end if;

  select shipping_flat_fee_cents,
         timezone('utc', now()) + make_interval(mins => reserve_window_minutes),
         whatsapp_number
  into v_shipping_cents, v_reserve_expires_at, v_whatsapp_number
  from public.store_settings
  where id = true;

  if v_delivery_method = 'pickup' then
    v_shipping_cents := 0;
  end if;

  -- Grouping duplicate variants before locking prevents a crafted request from
  -- creating competing reservations for the same SKU.
  for v_item in
    select variant_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as input(variant_id uuid, quantity integer)
    group by variant_id
    order by variant_id
  loop
    if v_item.variant_id is null or v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'invalid_items: quantity_must_be_positive';
    end if;

    select
      pv.id,
      pv.product_id,
      pv.name as variant_name,
      pv.sku,
      pv.sale_price_cents,
      pv.is_active,
      pv.is_presale,
      p.name as product_name,
      p.status as product_status,
      ii.current_stock,
      ii.reserved_stock
    into v_variant
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    join public.inventory_items ii on ii.variant_id = pv.id and ii.is_active = true
    where pv.id = v_item.variant_id
    for update of pv, ii;

    if not found or v_variant.product_status <> 'published' or not v_variant.is_active then
      raise exception 'product_unavailable: variant_not_sellable';
    end if;

    -- Preventas use inventory_items as their allocated sellable quota until a
    -- separate multi-warehouse/preorder allocation module is introduced.
    if (v_variant.current_stock - v_variant.reserved_stock) < v_item.quantity then
      raise exception 'out_of_stock: insufficient_available_stock';
    end if;

    v_subtotal_cents := v_subtotal_cents + (v_variant.sale_price_cents * v_item.quantity);
    v_normalized_items := v_normalized_items || jsonb_build_array(jsonb_build_object(
      'variantId', v_variant.id,
      'productId', v_variant.product_id,
      'productName', v_variant.product_name,
      'variantName', v_variant.variant_name,
      'sku', v_variant.sku,
      'unitPriceCents', v_variant.sale_price_cents,
      'quantity', v_item.quantity
    ));
  end loop;

  if jsonb_array_length(v_normalized_items) = 0 then
    raise exception 'invalid_items: empty_cart';
  end if;

  v_total_cents := v_subtotal_cents + v_shipping_cents;

  select id into v_customer_id
  from public.customers c
  where (v_customer_email is not null and c.email = v_customer_email)
     or (v_customer_phone is not null and c.phone = v_customer_phone)
  order by c.updated_at desc
  limit 1;

  if v_customer_id is null then
    insert into public.customers (email, full_name, phone, document_number)
    values (
      v_customer_email, v_customer_name, v_customer_phone,
      nullif(btrim(coalesce(p_customer ->> 'documentNumber', '')), '')
    )
    returning id into v_customer_id;
  else
    update public.customers
    set email = coalesce(v_customer_email, email),
        full_name = v_customer_name,
        phone = v_customer_phone,
        document_number = coalesce(nullif(btrim(coalesce(p_customer ->> 'documentNumber', '')), ''), document_number)
    where id = v_customer_id;
  end if;

  v_order_number := public.generate_order_number();

  insert into public.orders (
    order_number, customer_id, payment_method, subtotal_cents, shipping_cents,
    total_cents, delivery_method, delivery_address, delivery_district, customer_note,
    idempotency_key, reserve_expires_at
  )
  values (
    v_order_number, v_customer_id,
    coalesce(nullif(btrim(coalesce(p_payment ->> 'method', '')), ''), 'manual_review'),
    v_subtotal_cents, v_shipping_cents, v_total_cents, v_delivery_method,
    nullif(btrim(coalesce(p_delivery ->> 'address', '')), ''),
    nullif(btrim(coalesce(p_delivery ->> 'district', '')), ''),
    nullif(btrim(coalesce(p_customer ->> 'note', '')), ''),
    p_idempotency_key, v_reserve_expires_at
  )
  returning id into v_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, reason)
  values (v_order_id, null, 'pending_payment', 'Pedido creado con reserva temporal');

  insert into public.payment_attempts (order_id, provider, status, amount_cents)
  values (
    v_order_id,
    coalesce(nullif(btrim(coalesce(p_payment ->> 'method', '')), ''), 'manual_review'),
    'pending',
    v_total_cents
  );

  for v_item in select value from jsonb_array_elements(v_normalized_items)
  loop
    insert into public.order_items (
      order_id, variant_id, product_id, product_name_snapshot, variant_name_snapshot,
      sku_snapshot, unit_price_cents, quantity, line_total_cents
    )
    values (
      v_order_id,
      (v_item.value ->> 'variantId')::uuid,
      (v_item.value ->> 'productId')::uuid,
      v_item.value ->> 'productName',
      v_item.value ->> 'variantName',
      v_item.value ->> 'sku',
      (v_item.value ->> 'unitPriceCents')::integer,
      (v_item.value ->> 'quantity')::integer,
      (v_item.value ->> 'unitPriceCents')::integer * (v_item.value ->> 'quantity')::integer
    );

    insert into public.inventory_reservations (variant_id, order_id, quantity, expires_at)
    values (
      (v_item.value ->> 'variantId')::uuid, v_order_id,
      (v_item.value ->> 'quantity')::integer, v_reserve_expires_at
    )
    returning id into v_reservation_id;

    update public.inventory_items
    set reserved_stock = reserved_stock + (v_item.value ->> 'quantity')::integer
    where variant_id = (v_item.value ->> 'variantId')::uuid;

    insert into public.inventory_movements (
      variant_id, order_id, reservation_id, delta_quantity, reason, note
    )
    values (
      (v_item.value ->> 'variantId')::uuid, v_order_id, v_reservation_id,
      -((v_item.value ->> 'quantity')::integer), 'reservation_created',
      'Reserva creada durante checkout'
    );
  end loop;

  v_whatsapp_message := format(
    'Hola, quiero confirmar el pedido %s. Monto exacto: S/ %s.',
    v_order_number, to_char(v_total_cents / 100.0, 'FM9999990.00')
  );

  return jsonb_build_object(
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'status', 'pending_payment',
    'paymentStatus', 'pending',
    'totalCents', v_total_cents,
    'reserveExpiresAt', v_reserve_expires_at,
    'whatsappNumber', v_whatsapp_number,
    'whatsappMessage', v_whatsapp_message
  );
exception
  when unique_violation then
    select * into v_existing_order from public.orders where idempotency_key = p_idempotency_key limit 1;
    if found then
      return jsonb_build_object(
        'orderId', v_existing_order.id,
        'orderNumber', v_existing_order.order_number,
        'status', v_existing_order.status,
        'paymentStatus', v_existing_order.payment_status,
        'totalCents', v_existing_order.total_cents,
        'reserveExpiresAt', v_existing_order.reserve_expires_at
      );
    end if;
    raise;
end;
$$;

create or replace function public.confirm_manual_payment(
  p_order_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_reservation record;
begin
  if not public.is_staff() then
    raise exception 'forbidden: staff_role_required';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'not_found: order'; end if;
  if v_order.status <> 'pending_payment' then
    raise exception 'invalid_transition: order_is_not_pending_payment';
  end if;
  if v_order.reserve_expires_at <= timezone('utc', now()) then
    raise exception 'invalid_transition: reservation_expired';
  end if;

  for v_reservation in
    select * from public.inventory_reservations
    where order_id = v_order.id and status = 'active'
    order by variant_id
    for update
  loop
    update public.inventory_items
    set current_stock = current_stock - v_reservation.quantity,
        reserved_stock = reserved_stock - v_reservation.quantity
    where variant_id = v_reservation.variant_id
      and current_stock >= v_reservation.quantity
      and reserved_stock >= v_reservation.quantity;

    if not found then
      raise exception 'inventory_inconsistent: cannot_confirm_order';
    end if;

    update public.inventory_reservations
    set status = 'converted', converted_at = timezone('utc', now())
    where id = v_reservation.id;

    insert into public.inventory_movements (
      variant_id, order_id, reservation_id, delta_quantity, reason, note, created_by
    ) values (
      -- The reservation already reduced available stock. Conversion reduces
      -- physical and reserved stock together, so availability does not change.
      v_reservation.variant_id, v_order.id, v_reservation.id, 0,
      'sale_confirmed', coalesce(p_note, 'Pago manual confirmado'), auth.uid()
    );
  end loop;

  update public.orders
  set status = 'paid', payment_status = 'confirmed'
  where id = v_order.id;

  update public.payment_attempts
  set status = 'confirmed', metadata = metadata || jsonb_build_object('confirmedBy', auth.uid(), 'note', p_note)
  where order_id = v_order.id and status in ('pending', 'submitted_for_review');

  insert into public.order_status_history (order_id, from_status, to_status, reason, actor_user_id)
  values (v_order.id, 'pending_payment', 'paid', coalesce(p_note, 'Pago manual confirmado'), auth.uid());

  return jsonb_build_object('orderId', v_order.id, 'status', 'paid', 'paymentStatus', 'confirmed');
end;
$$;

create or replace function public.advance_order(
  p_order_id uuid,
  p_to_status public.order_status,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_allowed boolean := false;
begin
  if not public.is_staff() then raise exception 'forbidden: staff_role_required'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'not_found: order'; end if;

  v_allowed := (v_order.status = 'paid' and p_to_status = 'preparing')
    or (v_order.status = 'preparing' and p_to_status = 'shipped')
    or (v_order.status = 'shipped' and p_to_status = 'delivered');

  if not v_allowed then raise exception 'invalid_transition: unsupported_order_state'; end if;

  update public.orders set status = p_to_status where id = v_order.id;
  insert into public.order_status_history (order_id, from_status, to_status, reason, actor_user_id)
  values (v_order.id, v_order.status, p_to_status, p_note, auth.uid());

  return jsonb_build_object('orderId', v_order.id, 'status', p_to_status);
end;
$$;

create or replace function public.cancel_pending_order(
  p_order_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_reservation record;
begin
  if not public.is_staff() then raise exception 'forbidden: staff_role_required'; end if;
  if nullif(btrim(p_reason), '') is null then raise exception 'invalid_request: cancellation_reason_required'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'not_found: order'; end if;
  if v_order.status <> 'pending_payment' then raise exception 'invalid_transition: only_pending_orders_can_cancel'; end if;

  for v_reservation in
    select * from public.inventory_reservations
    where order_id = v_order.id and status = 'active'
    order by variant_id
    for update
  loop
    update public.inventory_reservations
    set status = 'released', released_at = timezone('utc', now())
    where id = v_reservation.id;

    update public.inventory_items
    set reserved_stock = reserved_stock - v_reservation.quantity
    where variant_id = v_reservation.variant_id and reserved_stock >= v_reservation.quantity;

    if not found then raise exception 'inventory_inconsistent: cannot_release_reservation'; end if;

    insert into public.inventory_movements (
      variant_id, order_id, reservation_id, delta_quantity, reason, note, created_by
    ) values (
      v_reservation.variant_id, v_order.id, v_reservation.id, v_reservation.quantity,
      'reservation_released', p_reason, auth.uid()
    );
  end loop;

  update public.orders set status = 'cancelled', payment_status = 'rejected' where id = v_order.id;
  update public.payment_attempts set status = 'rejected' where order_id = v_order.id and status in ('pending', 'submitted_for_review');
  insert into public.order_status_history (order_id, from_status, to_status, reason, actor_user_id)
  values (v_order.id, 'pending_payment', 'cancelled', p_reason, auth.uid());

  return jsonb_build_object('orderId', v_order.id, 'status', 'cancelled');
end;
$$;

create or replace function public.adjust_inventory(
  p_variant_id uuid,
  p_delta_quantity integer,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory public.inventory_items%rowtype;
begin
  if not public.is_staff() then raise exception 'forbidden: staff_role_required'; end if;
  if p_delta_quantity = 0 then raise exception 'invalid_request: non_zero_adjustment_required'; end if;
  if nullif(btrim(p_note), '') is null then raise exception 'invalid_request: adjustment_note_required'; end if;

  select * into v_inventory from public.inventory_items where variant_id = p_variant_id for update;
  if not found then raise exception 'not_found: inventory_item'; end if;
  if v_inventory.current_stock + p_delta_quantity < v_inventory.reserved_stock then
    raise exception 'invalid_adjustment: cannot_reduce_reserved_stock';
  end if;

  update public.inventory_items
  set current_stock = current_stock + p_delta_quantity
  where id = v_inventory.id;

  insert into public.inventory_movements (variant_id, delta_quantity, reason, note, created_by)
  values (p_variant_id, p_delta_quantity, 'manual_adjustment', p_note, auth.uid());

  insert into public.audit_log (entity_type, entity_id, action, payload, actor_user_id)
  values (
    'inventory_item', v_inventory.id, 'manual_adjustment',
    jsonb_build_object('variantId', p_variant_id, 'deltaQuantity', p_delta_quantity, 'note', p_note),
    auth.uid()
  );

  return jsonb_build_object('variantId', p_variant_id, 'currentStock', v_inventory.current_stock + p_delta_quantity);
end;
$$;

revoke all on function public.create_order(text, jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function public.create_order(text, jsonb, jsonb, jsonb, jsonb) to anon, authenticated;
revoke all on function public.confirm_manual_payment(uuid, text) from public;
grant execute on function public.confirm_manual_payment(uuid, text) to authenticated;
revoke all on function public.advance_order(uuid, public.order_status, text) from public;
grant execute on function public.advance_order(uuid, public.order_status, text) to authenticated;
revoke all on function public.cancel_pending_order(uuid, text) from public;
grant execute on function public.cancel_pending_order(uuid, text) to authenticated;
revoke all on function public.adjust_inventory(uuid, integer, text) from public;
grant execute on function public.adjust_inventory(uuid, integer, text) to authenticated;
