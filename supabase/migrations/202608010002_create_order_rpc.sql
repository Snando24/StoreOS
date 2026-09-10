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
  v_delivery_method public.delivery_method;
  v_item record;
  v_variant record;
  v_quantity integer;
  v_normalized_items jsonb := '[]'::jsonb;
  v_reservation_id uuid;
  v_whatsapp_number text;
  v_whatsapp_message text;
begin
  if coalesce(btrim(p_idempotency_key), '') = '' then
    raise exception 'duplicate_request: idempotency_key_required';
  end if;

  select *
  into v_existing_order
  from public.orders
  where idempotency_key = p_idempotency_key
  limit 1;

  if found then
    select whatsapp_number
    into v_whatsapp_number
    from public.store_settings
    where id = true;

    v_whatsapp_message := format('Hola, quiero confirmar el pedido %s.', v_existing_order.order_number);

    return jsonb_build_object(
      'orderId', v_existing_order.id,
      'orderNumber', v_existing_order.order_number,
      'status', v_existing_order.status,
      'paymentStatus', v_existing_order.payment_status,
      'totalCents', v_existing_order.total_cents,
      'reserveExpiresAt', v_existing_order.reserve_expires_at,
      'whatsappNumber', v_whatsapp_number,
      'whatsappMessage', v_whatsapp_message
    );
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'invalid_items: empty_cart';
  end if;

  v_customer_email := nullif(trim(coalesce(p_customer ->> 'email', '')), '')::citext;
  v_customer_phone := nullif(regexp_replace(coalesce(p_customer ->> 'phone', ''), '\D', '', 'g'), '');
  v_delivery_method := coalesce((p_delivery ->> 'method')::public.delivery_method, 'shipping');

  select shipping_flat_fee_cents,
         timezone('utc', now()) + make_interval(mins => reserve_window_minutes),
         whatsapp_number
  into v_shipping_cents, v_reserve_expires_at, v_whatsapp_number
  from public.store_settings
  where id = true;

  if v_delivery_method = 'pickup' then
    v_shipping_cents := 0;
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
    order by (value ->> 'variantId')::uuid
  loop
    v_quantity := coalesce((v_item.value ->> 'quantity')::integer, 0);

    if v_quantity <= 0 then
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
    join public.inventory_items ii on ii.variant_id = pv.id
    where pv.id = (v_item.value ->> 'variantId')::uuid
    for update of pv, ii;

    if not found then
      raise exception 'product_unavailable: variant_not_found';
    end if;

    if v_variant.product_status <> 'published' or v_variant.is_active = false then
      raise exception 'product_unavailable: variant_not_sellable';
    end if;

    if v_variant.is_presale = false and (v_variant.current_stock - v_variant.reserved_stock) < v_quantity then
      raise exception 'out_of_stock: insufficient_available_stock';
    end if;

    v_subtotal_cents := v_subtotal_cents + (v_variant.sale_price_cents * v_quantity);
    v_normalized_items := v_normalized_items || jsonb_build_array(
      jsonb_build_object(
        'variantId', v_variant.id,
        'productId', v_variant.product_id,
        'productName', v_variant.product_name,
        'variantName', v_variant.variant_name,
        'sku', v_variant.sku,
        'unitPriceCents', v_variant.sale_price_cents,
        'quantity', v_quantity
      )
    );
  end loop;

  v_total_cents := v_subtotal_cents + v_shipping_cents;

  select id
  into v_customer_id
  from public.customers c
  where (v_customer_email is not null and c.email = v_customer_email)
     or (v_customer_phone is not null and c.phone = v_customer_phone)
  order by c.updated_at desc
  limit 1;

  if v_customer_id is null then
    insert into public.customers (
      email,
      full_name,
      phone,
      document_number
    )
    values (
      v_customer_email,
      trim(coalesce(p_customer ->> 'name', 'Cliente invitado')),
      v_customer_phone,
      nullif(trim(coalesce(p_customer ->> 'documentNumber', '')), '')
    )
    returning id into v_customer_id;
  else
    update public.customers
    set
      email = coalesce(v_customer_email, email),
      full_name = trim(coalesce(p_customer ->> 'name', full_name)),
      phone = coalesce(v_customer_phone, phone),
      document_number = coalesce(nullif(trim(coalesce(p_customer ->> 'documentNumber', '')), ''), document_number)
    where id = v_customer_id;
  end if;

  v_order_number := public.generate_order_number();

  insert into public.orders (
    order_number,
    customer_id,
    payment_method,
    subtotal_cents,
    shipping_cents,
    total_cents,
    delivery_method,
    delivery_address,
    delivery_district,
    customer_note,
    idempotency_key,
    reserve_expires_at
  )
  values (
    v_order_number,
    v_customer_id,
    coalesce(nullif(trim(coalesce(p_payment ->> 'method', '')), ''), 'manual_review'),
    v_subtotal_cents,
    v_shipping_cents,
    v_total_cents,
    v_delivery_method,
    nullif(trim(coalesce(p_delivery ->> 'address', '')), ''),
    nullif(trim(coalesce(p_delivery ->> 'district', '')), ''),
    nullif(trim(coalesce(p_customer ->> 'note', '')), ''),
    p_idempotency_key,
    v_reserve_expires_at
  )
  returning id into v_order_id;

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    reason
  )
  values (
    v_order_id,
    null,
    'pending_payment',
    'Pedido creado con reserva temporal'
  );

  for v_item in
    select value
    from jsonb_array_elements(v_normalized_items)
  loop
    insert into public.order_items (
      order_id,
      variant_id,
      product_id,
      product_name_snapshot,
      variant_name_snapshot,
      sku_snapshot,
      unit_price_cents,
      quantity,
      line_total_cents
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
      ((v_item.value ->> 'unitPriceCents')::integer * (v_item.value ->> 'quantity')::integer)
    );

    insert into public.inventory_reservations (
      variant_id,
      order_id,
      quantity,
      expires_at
    )
    values (
      (v_item.value ->> 'variantId')::uuid,
      v_order_id,
      (v_item.value ->> 'quantity')::integer,
      v_reserve_expires_at
    )
    returning id into v_reservation_id;

    update public.inventory_items
    set reserved_stock = reserved_stock + (v_item.value ->> 'quantity')::integer
    where variant_id = (v_item.value ->> 'variantId')::uuid;

    insert into public.inventory_movements (
      variant_id,
      order_id,
      reservation_id,
      delta_quantity,
      reason,
      note
    )
    values (
      (v_item.value ->> 'variantId')::uuid,
      v_order_id,
      v_reservation_id,
      -((v_item.value ->> 'quantity')::integer),
      'reservation_created',
      'Reserva creada durante checkout'
    );
  end loop;

  v_whatsapp_message := format(
    'Hola, quiero confirmar el pedido %s. Monto exacto: S/ %s.',
    v_order_number,
    to_char(v_total_cents / 100.0, 'FM9999990.00')
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
    select *
    into v_existing_order
    from public.orders
    where idempotency_key = p_idempotency_key
    limit 1;

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

revoke all on function public.create_order(text, jsonb, jsonb, jsonb, jsonb) from public;

create or replace function public.release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_processed integer := 0;
begin
  for v_row in
    select ir.id, ir.variant_id, ir.order_id, ir.quantity
    from public.inventory_reservations ir
    where ir.status = 'active'
      and ir.expires_at <= timezone('utc', now())
    for update of ir
  loop
    update public.inventory_reservations
    set
      status = 'expired',
      released_at = timezone('utc', now())
    where id = v_row.id;

    update public.inventory_items
    set reserved_stock = greatest(reserved_stock - v_row.quantity, 0)
    where variant_id = v_row.variant_id;

    insert into public.inventory_movements (
      variant_id,
      order_id,
      reservation_id,
      delta_quantity,
      reason,
      note
    )
    values (
      v_row.variant_id,
      v_row.order_id,
      v_row.id,
      v_row.quantity,
      'reservation_expired',
      'Reserva liberada por vencimiento automático'
    );

    update public.orders
    set status = 'expired'
    where id = v_row.order_id
      and status = 'pending_payment';

    insert into public.order_status_history (
      order_id,
      from_status,
      to_status,
      reason
    )
    values (
      v_row.order_id,
      'pending_payment',
      'expired',
      'Reserva vencida'
    );

    v_processed := v_processed + 1;
  end loop;

  return v_processed;
end;
$$;

revoke all on function public.release_expired_reservations() from public;
