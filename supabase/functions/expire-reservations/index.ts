import { corsHeaders, json, serviceClient } from '../_shared/security.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || request.headers.get('Authorization') !== `Bearer ${cronSecret}`) return json({ error: 'unauthorized' }, 401)
  try {
    const { data, error } = await serviceClient().rpc('release_expired_reservations')
    if (error) throw error
    return json({ released: data })
  } catch (error) {
    console.error('expire_reservations_error', error)
    return json({ error: 'expiration_failed' }, 500)
  }
})
