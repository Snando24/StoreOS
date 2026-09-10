-- Development/staging sample tenant. Run after all migrations.
insert into public.tenants (slug, name)
values ('animegeek', 'AnimeGeek')
on conflict (slug) do update set name = excluded.name;

insert into public.tenant_settings (
  tenant_id, store_name, order_prefix, currency_code, shipping_flat_fee_cents,
  reserve_window_minutes, whatsapp_number
)
select id, 'AnimeGeek', 'AKZ', 'PEN', 1200, 30, '51987654321'
from public.tenants where slug = 'animegeek'
on conflict (tenant_id) do update set
  store_name = excluded.store_name,
  order_prefix = excluded.order_prefix,
  shipping_flat_fee_cents = excluded.shipping_flat_fee_cents,
  reserve_window_minutes = excluded.reserve_window_minutes,
  whatsapp_number = excluded.whatsapp_number;

insert into public.brands (tenant_id, slug, name)
select t.id, seed.slug, seed.name
from public.tenants t
cross join (values
  ('banpresto', 'Banpresto'), ('good-smile-company', 'Good Smile Company'),
  ('kotobukiya', 'Kotobukiya'), ('ivrea', 'Ivrea')
) as seed(slug, name)
where t.slug = 'animegeek'
on conflict (tenant_id, slug) do update set name = excluded.name;

insert into public.categories (tenant_id, slug, name)
select t.id, seed.slug, seed.name
from public.tenants t
cross join (values ('figuras', 'Figuras'), ('manga', 'Manga')) as seed(slug, name)
where t.slug = 'animegeek'
on conflict (tenant_id, slug) do update set name = excluded.name;

insert into public.franchises (tenant_id, slug, name)
select t.id, seed.slug, seed.name
from public.tenants t
cross join (values
  ('naruto-shippuden', 'Naruto Shippuden'), ('demon-slayer', 'Demon Slayer'), ('dragon-ball', 'Dragon Ball')
) as seed(slug, name)
where t.slug = 'animegeek'
on conflict (tenant_id, slug) do update set name = excluded.name;

insert into public.products (
  tenant_id, slug, name, description, status, brand_id, primary_category_id,
  primary_franchise_id, published_at
)
select t.id, seed.slug, seed.name, seed.description, 'published'::public.product_status,
       b.id, c.id, f.id, timezone('utc', now())
from public.tenants t
join (values
  ('naruto-modo-sabio', 'Figura Naruto Uzumaki — Modo Sabio', 'Figura de colección en escala 1/8 con base, efectos de chakra y empaque premium.', 'banpresto', 'figuras', 'naruto-shippuden'),
  ('tanjiro-concentracion-total', 'Figura Tanjiro Kamado — Concentración Total', 'Figura de resina con acabado premium y efectos translúcidos inspirados en la respiración del agua.', 'good-smile-company', 'figuras', 'demon-slayer'),
  ('dragon-ball-super-pack-1-10', 'Manga Dragon Ball Super — Vol. 01–10', 'Pack de diez volúmenes para iniciar la colección en español.', 'ivrea', 'manga', 'dragon-ball')
) as seed(slug, name, description, brand_slug, category_slug, franchise_slug) on true
join public.brands b on b.tenant_id = t.id and b.slug = seed.brand_slug
join public.categories c on c.tenant_id = t.id and c.slug = seed.category_slug
join public.franchises f on f.tenant_id = t.id and f.slug = seed.franchise_slug
where t.slug = 'animegeek'
on conflict (tenant_id, slug) do update set
  name = excluded.name, description = excluded.description, status = excluded.status,
  brand_id = excluded.brand_id, primary_category_id = excluded.primary_category_id,
  primary_franchise_id = excluded.primary_franchise_id, published_at = excluded.published_at;

insert into public.product_categories (product_id, category_id)
select p.id, p.primary_category_id from public.products p
join public.tenants t on t.id = p.tenant_id where t.slug = 'animegeek'
on conflict do nothing;

insert into public.product_franchises (product_id, franchise_id)
select p.id, p.primary_franchise_id from public.products p
join public.tenants t on t.id = p.tenant_id where t.slug = 'animegeek'
on conflict do nothing;

insert into public.product_variants (
  tenant_id, product_id, sku, name, condition_label, sale_price_cents,
  compare_at_price_cents, currency_code, weight_grams, is_active, is_presale
)
select p.tenant_id, p.id, seed.sku, seed.variant_name, seed.condition_label,
       seed.sale_price_cents, seed.compare_at_price_cents, 'PEN', seed.weight_grams, true, false
from (values
  ('naruto-modo-sabio', 'NRT-SAGE-01', 'Base Estándar', 'Nuevo', 28990, null, 320),
  ('tanjiro-concentracion-total', 'DS-TAN-01', 'Edición Premium', 'Nuevo', 34900, 42900, 450),
  ('dragon-ball-super-pack-1-10', 'DBS-MNG-01', 'Pack Completo', 'Nuevo', 18990, null, 1200)
) as seed(product_slug, sku, variant_name, condition_label, sale_price_cents, compare_at_price_cents, weight_grams)
join public.products p on p.slug = seed.product_slug
join public.tenants t on t.id = p.tenant_id and t.slug = 'animegeek'
on conflict (tenant_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, condition_label = excluded.condition_label,
  sale_price_cents = excluded.sale_price_cents, compare_at_price_cents = excluded.compare_at_price_cents,
  weight_grams = excluded.weight_grams, is_active = excluded.is_active, is_presale = excluded.is_presale;

insert into public.inventory_items (variant_id, current_stock, reserved_stock, reorder_point)
select pv.id, seed.current_stock, 0, seed.reorder_point
from (values ('NRT-SAGE-01', 12, 3), ('DS-TAN-01', 5, 2), ('DBS-MNG-01', 8, 2)) as seed(sku, current_stock, reorder_point)
join public.product_variants pv on pv.sku = seed.sku
join public.tenants t on t.id = pv.tenant_id and t.slug = 'animegeek'
on conflict (variant_id) do update set
  current_stock = excluded.current_stock, reserved_stock = excluded.reserved_stock, reorder_point = excluded.reorder_point;

insert into public.product_images (tenant_id, product_id, storage_path, public_url, alt_text, sort_order, is_primary)
select p.tenant_id, p.id, seed.storage_path, seed.public_url, seed.alt_text, 0, true
from (values
  ('naruto-modo-sabio', 'demo/naruto-sage/main.webp', 'https://images.unsplash.com/photo-1614583225154-5fcdda07019e?w=1200&h=1200&fit=crop&auto=format', 'Figura Naruto Uzumaki Modo Sabio'),
  ('tanjiro-concentracion-total', 'demo/tanjiro/main.webp', 'https://images.unsplash.com/photo-1705932461994-6fb2b07f27dd?w=1200&h=1200&fit=crop&auto=format', 'Figura Tanjiro Kamado con efectos de agua'),
  ('dragon-ball-super-pack-1-10', 'demo/dragon-ball-super/main.webp', 'https://images.unsplash.com/photo-1709675577966-6231e5a2ac43?w=1200&h=1200&fit=crop&auto=format', 'Pack de mangas Dragon Ball Super volúmenes 1 al 10')
) as seed(product_slug, storage_path, public_url, alt_text)
join public.products p on p.slug = seed.product_slug
join public.tenants t on t.id = p.tenant_id and t.slug = 'animegeek'
where not exists (
  select 1 from public.product_images pi where pi.product_id = p.id and pi.storage_path = seed.storage_path
);

insert into public.inventory_movements (variant_id, delta_quantity, reason, note)
select pv.id, ii.current_stock, 'seed_load', 'Carga inicial de inventario'
from public.inventory_items ii join public.product_variants pv on pv.id = ii.variant_id
join public.tenants t on t.id = pv.tenant_id and t.slug = 'animegeek'
where not exists (
  select 1 from public.inventory_movements im where im.variant_id = pv.id and im.reason = 'seed_load'
);
