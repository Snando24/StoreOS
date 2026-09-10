import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
export const tenantSlug = import.meta.env.VITE_TENANT_SLUG?.trim().toLowerCase()

// Authentication and the SaaS workspace must not depend on a demo storefront.
// A tenant slug is only required by the public catalog/checkout routes.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)
export const isStorefrontConfigured = Boolean(isSupabaseConfigured && tenantSlug)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
