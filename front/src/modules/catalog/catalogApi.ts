import { supabase, tenantSlug } from '@/lib/supabase'
import type { Product, ProductStock } from './types'

type CatalogRow = {
  product_id: string
  slug: string
  name: string
  description: string
  brand: string | null
  category: string | null
  franchise: string | null
  variant_id: string
  variant_name: string
  condition_label: string
  sale_price_cents: number
  compare_at_price_cents: number | null
  is_presale: boolean
  presale_release_at: string | null
  available_stock: number
  primary_image_url: string | null
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1614583225154-5fcdda07019e?w=800&h=800&fit=crop&auto=format'

function formatPresaleDate(value: string | null): string | undefined {
  if (!value) return undefined
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function resolveStock(row: CatalogRow): ProductStock {
  if (row.is_presale) return 'presale'
  if (row.available_stock <= 0) return 'out-of-stock'
  if (row.compare_at_price_cents && row.compare_at_price_cents > row.sale_price_cents) return 'deal'
  if (row.available_stock <= 2) return 'last-units'
  return 'available'
}

function mapRow(row: CatalogRow): Product {
  return {
    id: row.product_id,
    variantId: row.variant_id,
    name: row.name,
    franchise: row.franchise ?? 'Coleccionables',
    category: row.category ?? 'Otros',
    price: row.sale_price_cents / 100,
    originalPrice: row.compare_at_price_cents ? row.compare_at_price_cents / 100 : undefined,
    stock: resolveStock(row),
    stockCount: row.available_stock,
    condition: row.condition_label,
    images: [row.primary_image_url ?? FALLBACK_IMAGE],
    variants: [row.variant_name],
    description: row.description,
    presaleDate: formatPresaleDate(row.presale_release_at),
    brand: row.brand ?? 'Sin marca',
    weight: '—',
  }
}

export async function getPublishedProducts(requestedTenantSlug = tenantSlug): Promise<Product[]> {
  if (!supabase || !requestedTenantSlug) return []

  const { data, error } = await supabase.functions.invoke('catalog', {
    body: { tenantSlug: requestedTenantSlug },
  })

  if (error) throw error
  return ((data?.products ?? []) as CatalogRow[]).map(mapRow)
}
