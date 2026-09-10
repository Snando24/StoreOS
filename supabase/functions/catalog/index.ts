import { corsHeaders, json, serviceClient, validateTenantSlug } from '../_shared/security.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const { tenantSlug } = await request.json()
    const slug = validateTenantSlug(tenantSlug)
    if (!slug) return json({ error: 'invalid_tenant' }, 400)

    const supabase = serviceClient()
    const { data, error } = await supabase
      .from('catalog_products')
      .select('*')
      .eq('tenant_slug', slug)
      .order('name', { ascending: true })
    if (error) throw error

    const products = await Promise.all((data ?? []).map(async (product) => {
      let primaryImageUrl: string | null = null
      if (product.primary_image_path) {
        const { data: signed } = await supabase.storage.from('tenant-assets').createSignedUrl(product.primary_image_path, 900)
        primaryImageUrl = signed?.signedUrl ?? null
      }
      return { ...product, primary_image_url: primaryImageUrl, primary_image_path: undefined }
    }))

    return json({ products }, 200, { 'Cache-Control': 'public, max-age=60, s-maxage=300' })
  } catch (error) {
    console.error('catalog_error', error)
    return json({ error: 'catalog_unavailable' }, 500)
  }
})
