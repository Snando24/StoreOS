import { corsHeaders, json, serviceClient, sha256, validateTenantSlug } from '../_shared/security.ts'

type CheckoutItem = { variantId?: unknown; quantity?: unknown }

function isBoundedText(value: unknown, max: number, required = false): value is string {
  return typeof value === 'string' && (!required || value.trim().length > 0) && value.length <= max
}

async function verifyTurnstile(token: unknown, ip: string | null) {
  const secret = Deno.env.get('TURNSTILE_SECRET')
  if (!secret) return Deno.env.get('REQUIRE_TURNSTILE') !== 'true'
  if (!isBoundedText(token, 4096, true)) return false
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
  })
  const result = await response.json() as { success?: boolean }
  return result.success === true
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0)
    if (Number.isFinite(contentLength) && contentLength > 32 * 1024) return json({ error: 'payload_too_large' }, 413)
    const payload = await request.json()
    const tenantSlug = validateTenantSlug(payload.tenantSlug)
    const customer = payload.customer
    const delivery = payload.delivery
    const payment = payload.payment
    const items = payload.items as CheckoutItem[]
    const idempotencyKey = payload.idempotencyKey
    if (!tenantSlug || !isBoundedText(idempotencyKey, 200, true) || !customer || !delivery || !payment || !Array.isArray(items) || items.length === 0 || items.length > 20) {
      return json({ error: 'invalid_request' }, 400)
    }
    if (!isBoundedText(customer.name, 120, true) || !isBoundedText(customer.phone, 32, true) || !isBoundedText(customer.email ?? '', 254) || !isBoundedText(customer.documentNumber ?? '', 32) || !isBoundedText(delivery.address ?? '', 300) || !isBoundedText(delivery.district ?? '', 100) || !isBoundedText(payment.method, 40, true)) {
      return json({ error: 'invalid_request' }, 400)
    }
    if (items.some((item) => typeof item.variantId !== 'string' || !/^[0-9a-f-]{36}$/i.test(item.variantId) || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 20)) {
      return json({ error: 'invalid_items' }, 400)
    }

    const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const userAgent = request.headers.get('user-agent') ?? ''
    if (!await verifyTurnstile(payload.turnstileToken, ip)) return json({ error: 'human_verification_failed' }, 403)

    const fingerprint = await sha256(`${tenantSlug}|${ip ?? 'unknown'}|${userAgent}|${customer.phone.replace(/\D/g, '')}`)
    const supabase = serviceClient()
    const { error: rateError } = await supabase.rpc('enforce_checkout_rate_limit', { p_tenant_slug: tenantSlug, p_fingerprint: fingerprint })
    if (rateError) return json({ error: rateError.message.includes('rate_limited') ? 'rate_limited' : 'checkout_unavailable' }, rateError.message.includes('rate_limited') ? 429 : 400)

    const { error: identityError } = await supabase.rpc('validate_tenant_customer_identity', { p_tenant_slug: tenantSlug, p_phone: customer.phone, p_email: customer.email ?? '' })
    if (identityError) return json({ error: identityError.message.includes('customer_identity_conflict') ? 'customer_identity_conflict' : 'checkout_unavailable' }, 400)

    const { data, error } = await supabase.rpc('create_tenant_order', {
      p_tenant_slug: tenantSlug,
      p_idempotency_key: idempotencyKey,
      p_customer: customer,
      p_delivery: delivery,
      p_payment: payment,
      p_items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
    })
    if (error) {
      const status = error.message.includes('out_of_stock') ? 409 : 400
      return json({ error: error.message.includes('out_of_stock') ? 'out_of_stock' : 'checkout_unavailable' }, status)
    }
    return json(data, 201)
  } catch (error) {
    console.error('create_order_error', error)
    return json({ error: 'checkout_unavailable' }, 500)
  }
})
