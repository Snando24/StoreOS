import { corsHeaders, json } from '../_shared/security.ts'

Deno.serve((request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405)
  return json({ status: 'ok', service: 'storefront-saas-functions', timestamp: new Date().toISOString() })
})
