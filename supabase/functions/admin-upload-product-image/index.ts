import { createClient } from 'npm:@supabase/supabase-js@^2'
import { corsHeaders, json, publishableKey, serviceClient, validateTenantSlug } from '../_shared/security.ts'

function hasValidImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  const isJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isPng = bytes.length > 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)
  const isWebp = bytes.length > 12 && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  return (mimeType === 'image/jpeg' && isJpeg) || (mimeType === 'image/png' && isPng) || (mimeType === 'image/webp' && isWebp)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const authHeader = request.headers.get('Authorization')
    const url = Deno.env.get('SUPABASE_URL')
    const clientKey = publishableKey()
    if (!authHeader || !url || !clientKey) return json({ error: 'unauthorized' }, 401)
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401)
    const accessToken = authHeader.slice('Bearer '.length)
    const authClient = createClient(url, clientKey, { auth: { persistSession: false } })
    const { data: { user }, error: userError } = await authClient.auth.getUser(accessToken)
    if (userError || !user) return json({ error: 'unauthorized' }, 401)

    const formData = await request.formData()
    const tenantSlug = validateTenantSlug(formData.get('tenantSlug'))
    const productId = formData.get('productId')
    const image = formData.get('image')
    if (!tenantSlug || typeof productId !== 'string' || !/^[0-9a-f-]{36}$/i.test(productId) || !(image instanceof File)) return json({ error: 'invalid_request' }, 400)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.type) || image.size === 0 || image.size > 5 * 1024 * 1024) return json({ error: 'invalid_image' }, 400)

    const bytes = new Uint8Array(await image.arrayBuffer())
    if (!hasValidImageSignature(bytes, image.type)) return json({ error: 'invalid_image' }, 400)

    const supabase = serviceClient()
    const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).eq('status', 'active').maybeSingle()
    if (!tenant) return json({ error: 'tenant_not_found' }, 404)
    const { data: membership } = await supabase.from('tenant_memberships').select('role').eq('tenant_id', tenant.id).eq('user_id', user.id).maybeSingle()
    if (!membership || !['owner', 'admin', 'operator'].includes(membership.role)) return json({ error: 'forbidden' }, 403)
    const { data: product } = await supabase.from('products').select('id').eq('id', productId).eq('tenant_id', tenant.id).maybeSingle()
    if (!product) return json({ error: 'product_not_found' }, 404)

    const extension = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${tenant.id}/products/${product.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('tenant-assets').upload(path, bytes, { contentType: image.type, upsert: false })
    if (uploadError) throw uploadError
    const { data: lastImage } = await supabase.from('product_images').select('sort_order').eq('product_id', product.id).order('sort_order', { ascending: false }).limit(1).maybeSingle()
    const { error: imageError } = await supabase.from('product_images').insert({
      tenant_id: tenant.id, product_id: product.id, storage_path: path, public_url: `private://${path}`,
      alt_text: `${product.id} image`, sort_order: (lastImage?.sort_order ?? -1) + 1, is_primary: !lastImage,
    })
    if (imageError) throw imageError
    return json({ ok: true }, 201)
  } catch (error) {
    console.error('admin_upload_image_error', error)
    return json({ error: 'upload_failed' }, 500)
  }
})
