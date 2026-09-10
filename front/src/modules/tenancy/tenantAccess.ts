import { supabase, tenantSlug } from '@/lib/supabase'

export async function hasActiveTenantStaffAccess(userId: string): Promise<boolean> {
  if (!supabase || !tenantSlug) return false

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .eq('status', 'active')
    .maybeSingle()

  if (tenantError || !tenant) return false

  const { data: membership, error: membershipError } = await supabase
    .from('tenant_memberships')
    .select('role')
    .eq('tenant_id', tenant.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError || !membership) return false
  return ['owner', 'admin', 'operator'].includes(membership.role)
}
