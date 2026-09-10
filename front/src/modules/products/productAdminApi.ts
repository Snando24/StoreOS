import { supabase } from '@/lib/supabase'

export interface ProductDraft {
  name: string
  categoryName?: string
  brandName?: string
  description?: string
  isPublished: boolean
  variants: Array<{
    name: string
    stock: number
    salePriceCents: number
    compareAtPriceCents?: number
    conditionLabel?: string
    isPresale?: boolean
  }>
}

export type TenantProductStatus = 'draft' | 'published' | 'archived'

export interface TenantProductSummary {
  id: string
  name: string
  description: string
  status: TenantProductStatus
  category_name: string | null
  brand_name: string | null
  variant_count: number
  total_stock: number
  starting_price_cents: number
  updated_at: string
}

export interface TenantProductDetail {
  id: string
  name: string
  description: string
  status: TenantProductStatus
  categoryName: string | null
  brandName: string | null
  variants: Array<{
    id: string
    name: string
    salePriceCents: number
    compareAtPriceCents: number | null
    stock: number
    conditionLabel: string
    isPresale: boolean
  }>
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function createTenantProduct(tenantSlug: string, draft: ProductDraft, files: File[]): Promise<string> {
  if (!supabase || !tenantSlug) throw new Error('Supabase no está configurado.')
  if (draft.name.trim().length === 0 || draft.name.length > 160 || (draft.description?.length ?? 0) > 4_000 || draft.variants.length === 0 || draft.variants.length > 50 || files.length > 8) {
    throw new Error('El producto excede los límites permitidos.')
  }
  if (draft.variants.some((variant) => variant.name.length > 160 || !Number.isInteger(variant.stock) || variant.stock < 0 || variant.stock > 1_000_000 || !Number.isInteger(variant.salePriceCents) || variant.salePriceCents < 0 || variant.salePriceCents > 100_000_000)) {
    throw new Error('Una variante tiene datos inválidos.')
  }
  const slug = slugify(draft.name)
  if (!slug) throw new Error('Ingresa un nombre de producto válido.')

  const { data, error } = await supabase.rpc('tenant_create_product', {
    p_tenant_slug: tenantSlug,
    p_product: {
      name: draft.name,
      slug,
      categoryName: draft.categoryName ?? '',
      brandName: draft.brandName ?? '',
      description: draft.description ?? '',
      status: draft.isPublished ? 'published' : 'draft',
    },
    p_variants: draft.variants.map((variant) => ({
      name: variant.name,
      sale_price_cents: variant.salePriceCents,
      compare_at_price_cents: variant.compareAtPriceCents ?? null,
      stock: variant.stock,
      condition_label: variant.conditionLabel ?? 'Nuevo',
      is_presale: variant.isPresale ?? false,
    })),
  })
  if (error) throw error

  const productId = (data as { productId: string }).productId
  await uploadTenantProductImages(tenantSlug, productId, files)
  return productId
}

export async function uploadTenantProductImages(tenantSlug: string, productId: string, files: File[]): Promise<void> {
  if (!supabase || !tenantSlug) throw new Error('Supabase no está configurado.')
  if (files.length > 8) throw new Error('Puedes cargar hasta 8 imágenes por operación.')
  if (files.length === 0) return
  for (const file of files) {
    const formData = new FormData()
    formData.set('tenantSlug', tenantSlug)
    formData.set('productId', productId)
    formData.set('image', file)
    const { error: uploadError } = await supabase.functions.invoke('admin-upload-product-image', { body: formData })
    if (uploadError) throw uploadError
  }
}

export async function getTenantProducts(tenantSlug: string): Promise<TenantProductSummary[]> {
  if (!supabase || !tenantSlug) throw new Error('Supabase no está configurado.')
  const { data, error } = await supabase.rpc('tenant_list_products', { p_tenant_slug: tenantSlug })
  if (error) throw error
  return (data ?? []) as TenantProductSummary[]
}

export async function setTenantProductStatus(tenantSlug: string, productId: string, status: TenantProductStatus): Promise<void> {
  if (!supabase || !tenantSlug) throw new Error('Supabase no está configurado.')
  const { error } = await supabase.rpc('tenant_set_product_status', {
    p_tenant_slug: tenantSlug,
    p_product_id: productId,
    p_status: status,
  })
  if (error) throw error
}

export async function getTenantProductDetail(tenantSlug: string, productId: string): Promise<TenantProductDetail> {
  if (!supabase || !tenantSlug) throw new Error('Supabase no está configurado.')
  const { data, error } = await supabase.rpc('tenant_get_product_detail', {
    p_tenant_slug: tenantSlug,
    p_product_id: productId,
  })
  if (error) throw error
  return data as TenantProductDetail
}

export async function updateTenantProduct(tenantSlug: string, productId: string, draft: ProductDraft & { status: TenantProductStatus }, variantIds: Array<string | undefined>): Promise<void> {
  if (!supabase || !tenantSlug) throw new Error('Supabase no está configurado.')
  const { error } = await supabase.rpc('tenant_update_product', {
    p_tenant_slug: tenantSlug,
    p_product_id: productId,
    p_product: {
      name: draft.name,
      categoryName: draft.categoryName ?? '',
      brandName: draft.brandName ?? '',
      description: draft.description ?? '',
      status: draft.status,
    },
    p_variants: draft.variants.map((variant, index) => ({
      id: variantIds[index] ?? null,
      name: variant.name,
      sale_price_cents: variant.salePriceCents,
      compare_at_price_cents: variant.compareAtPriceCents ?? null,
      stock: variant.stock,
      condition_label: variant.conditionLabel ?? 'Nuevo',
      is_presale: variant.isPresale ?? false,
    })),
  })
  if (error) throw error
}
