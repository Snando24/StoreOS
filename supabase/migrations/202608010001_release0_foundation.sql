create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

create type public.app_role as enum ('admin', 'operator');
create type public.product_status as enum ('draft', 'published', 'archived');
create type public.order_status as enum ('pending_payment', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'expired');
create type public.payment_status as enum ('pending', 'submitted_for_review', 'confirmed', 'rejected', 'refunded');
create type public.delivery_method as enum ('shipping', 'pickup');
create type public.inventory_reservation_status as enum ('active', 'converted', 'released', 'expired');
create type public.inventory_movement_reason as enum (
  'manual_adjustment',
  'reservation_created',
  'reservation_released',
  'reservation_expired',
  'sale_confirmed',
  'order_cancelled',
  'seed_load'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'AnimeGeek',
  order_prefix text not null default 'AKZ',
  currency_code text not null default 'PEN',
  shipping_flat_fee_cents integer not null default 1200 check (shipping_flat_fee_cents >= 0),
  reserve_window_minutes integer not null default 30 check (reserve_window_minutes between 5 and 240),
  whatsapp_number text not null default '51987654321',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.store_settings (id)
values (true)
on conflict (id) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email citext,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role)
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.franchises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  status public.product_status not null default 'draft',
  brand_id uuid references public.brands (id) on delete set null,
  primary_category_id uuid references public.categories (id) on delete set null,
  primary_franchise_id uuid references public.franchises (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (product_id, category_id)
);

create table if not exists public.product_franchises (
  product_id uuid not null references public.products (id) on delete cascade,
  franchise_id uuid not null references public.franchises (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (product_id, franchise_id)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  name text not null default 'Default',
  condition_label text not null default 'Nuevo',
  sale_price_cents integer not null check (sale_price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents is null or compare_at_price_cents >= sale_price_cents),
  currency_code text not null default 'PEN',
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  is_active boolean not null default true,
  is_presale boolean not null default false,
  presale_release_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null unique references public.product_variants (id) on delete cascade,
  current_stock integer not null default 0 check (current_stock >= 0),
  reserved_stock integer not null default 0 check (reserved_stock >= 0),
  reorder_point integer not null default 2 check (reorder_point >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (reserved_stock <= current_stock)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email citext,
  full_name text not null,
  phone text,
  document_number text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.customers (id),
  status public.order_status not null default 'pending_payment',
  payment_status public.payment_status not null default 'pending',
  payment_method text not null,
  currency_code text not null default 'PEN',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  delivery_method public.delivery_method not null,
  delivery_address text,
  delivery_district text,
  customer_note text,
  idempotency_key text not null unique,
  reserve_expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id),
  product_id uuid not null references public.products (id),
  product_name_snapshot text not null,
  variant_name_snapshot text not null,
  sku_snapshot text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  reason text,
  actor_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null,
  provider_reference text,
  status public.payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  status public.inventory_reservation_status not null default 'active',
  expires_at timestamptz not null,
  released_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  reservation_id uuid references public.inventory_reservations (id) on delete set null,
  delta_quantity integer not null,
  reason public.inventory_movement_reason not null,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_products_status_published_at on public.products (status, published_at desc);
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
create index if not exists idx_product_categories_category_product on public.product_categories (category_id, product_id);
create index if not exists idx_product_franchises_franchise_product on public.product_franchises (franchise_id, product_id);
create index if not exists idx_product_images_product_sort on public.product_images (product_id, sort_order);
create index if not exists idx_orders_status_created_at on public.orders (status, created_at desc);
create index if not exists idx_orders_customer_created_at on public.orders (customer_id, created_at desc);
create index if not exists idx_inventory_reservations_active on public.inventory_reservations (variant_id, expires_at) where status = 'active';
create index if not exists idx_inventory_movements_variant_created_at on public.inventory_movements (variant_id, created_at desc);

create trigger trg_store_settings_updated_at
before update on public.store_settings
for each row
execute function public.set_updated_at();

create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger trg_brands_updated_at
before update on public.brands
for each row
execute function public.set_updated_at();

create trigger trg_categories_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

create trigger trg_franchises_updated_at
before update on public.franchises
for each row
execute function public.set_updated_at();

create trigger trg_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create trigger trg_product_variants_updated_at
before update on public.product_variants
for each row
execute function public.set_updated_at();

create trigger trg_inventory_items_updated_at
before update on public.inventory_items
for each row
execute function public.set_updated_at();

create trigger trg_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

create trigger trg_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'operator')
  );
$$;

create or replace function public.get_shipping_flat_fee_cents()
returns integer
language sql
stable
as $$
  select shipping_flat_fee_cents
  from public.store_settings
  where id = true;
$$;

create sequence if not exists public.order_number_seq start 1000;

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  v_prefix text;
  v_year text;
  v_sequence bigint;
begin
  select order_prefix into v_prefix
  from public.store_settings
  where id = true;

  v_sequence := nextval('public.order_number_seq');
  v_year := to_char(timezone('utc', now()), 'YYYY');

  return format('%s-%s-%s', v_prefix, v_year, lpad(v_sequence::text, 6, '0'));
end;
$$;

create or replace view public.catalog_products as
select
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
    select pi.public_url
    from public.product_images pi
    where pi.product_id = p.id
    order by pi.is_primary desc, pi.sort_order asc
    limit 1
  ) as primary_image_url
from public.products p
join public.product_variants pv on pv.product_id = p.id and pv.is_active = true
join public.inventory_items ii on ii.variant_id = pv.id and ii.is_active = true
left join public.brands b on b.id = p.brand_id
left join public.categories c on c.id = p.primary_category_id
left join public.franchises f on f.id = p.primary_franchise_id
where p.status = 'published';

grant select on public.catalog_products to anon, authenticated;

alter table public.store_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_items enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.audit_log enable row level security;

create policy products_public_read
on public.products
for select
to anon, authenticated
using (status = 'published');

create policy variants_public_read
on public.product_variants
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.products p
    where p.id = product_variants.product_id
      and p.status = 'published'
  )
);

create policy images_public_read
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products p
    where p.id = product_images.product_id
      and p.status = 'published'
  )
);

create policy staff_manage_store_settings
on public.store_settings
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_profiles
on public.profiles
for all
to authenticated
using (public.is_staff() or id = auth.uid())
with check (public.is_staff() or id = auth.uid());

create policy staff_read_user_roles
on public.user_roles
for select
to authenticated
using (public.is_staff() or user_id = auth.uid());

create policy staff_manage_catalog
on public.products
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_variants
on public.product_variants
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_images
on public.product_images
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_inventory
on public.inventory_items
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_customers
on public.customers
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_orders
on public.orders
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_order_items
on public.order_items
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_order_history
on public.order_status_history
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_payment_attempts
on public.payment_attempts
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_inventory_reservations
on public.inventory_reservations
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_inventory_movements
on public.inventory_movements
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

create policy staff_manage_audit_log
on public.audit_log
for all
to authenticated
using (public.is_staff())
with check (public.is_staff());
