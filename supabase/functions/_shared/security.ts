import { createClient } from 'npm:@supabase/supabase-js@^2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function getPlatformKey(keysEnvironmentName: string, legacyEnvironmentName: string): string | undefined {
  const encodedKeys = Deno.env.get(keysEnvironmentName)
  if (encodedKeys) {
    try {
      const keys = JSON.parse(encodedKeys) as Record<string, unknown>
      const defaultKey = keys.default
      if (typeof defaultKey === 'string' && defaultKey.length > 0) return defaultKey
    } catch {
      console.error(`Invalid ${keysEnvironmentName} configuration`)
    }
  }
  return Deno.env.get(legacyEnvironmentName)
}

export function publishableKey() {
  return getPlatformKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY')
}

export function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const secretKey = getPlatformKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !secretKey) throw new Error('Server configuration is incomplete.')
  return createClient(url, secretKey, { auth: { persistSession: false } })
}

export function json(body: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  })
}

export function validateTenantSlug(value: unknown): string | null {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : null
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
