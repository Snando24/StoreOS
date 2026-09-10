import { supabase } from '@/lib/supabase'

export type TenantRole = 'owner' | 'admin' | 'operator'

export interface TenantSummary {
  id: string
  slug: string
  name: string
  role: TenantRole
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function suggestedStoreSlug(name: string): string {
  return slugify(name).slice(0, 50)
}

function throwAuthError(message: string): never {
  if (message.toLowerCase().includes('email rate limit')) {
    throw new Error('Se alcanzó el límite de correos de Supabase. Espera una hora antes de solicitar otro envío o configura SMTP propio.')
  }
  throw new Error(message)
}

export async function signUpStoreOwner(input: { email: string; password: string; displayName: string }): Promise<'signed_in' | 'confirmation_required'> {
  if (!supabase) throw new Error('Configura Supabase antes de crear una tienda.')
  if (input.password.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.')

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { display_name: input.displayName.trim() } },
  })
  if (error) throwAuthError(error.message)
  if (!data.user) throw new Error('No se pudo crear la cuenta.')
  return data.session ? 'signed_in' : 'confirmation_required'
}

export async function resendStoreConfirmation(email: string): Promise<void> {
  if (!supabase) throw new Error('Configura Supabase antes de reenviar la confirmación.')
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
  if (error) throwAuthError(error.message)
}

export async function requestPasswordRecovery(email: string): Promise<void> {
  if (!supabase) throw new Error('Configura Supabase antes de recuperar la contraseña.')
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin,
  })
  if (error) throwAuthError(error.message)
}

export async function updateRecoveredPassword(password: string): Promise<void> {
  if (!supabase) throw new Error('Configura Supabase antes de actualizar la contraseña.')
  if (password.length < 12) throw new Error('La contraseña debe tener al menos 12 caracteres.')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throwAuthError(error.message)
}

export async function getMyTenants(): Promise<TenantSummary[]> {
  if (!supabase) return []
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data: memberships, error: membershipError } = await supabase
    .from('tenant_memberships')
    .select('tenant_id, role')
    .eq('user_id', user.id)
  if (membershipError) throw membershipError
  if (!memberships?.length) return []

  const tenantIds = memberships.map((membership) => membership.tenant_id)
  const { data: tenants, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .in('id', tenantIds)
    .eq('status', 'active')
  if (tenantError) throw tenantError

  const roleByTenant = new Map(memberships.map((membership) => [membership.tenant_id, membership.role as TenantRole]))
  return (tenants ?? []).map((tenant) => ({
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    role: roleByTenant.get(tenant.id) ?? 'operator',
  }))
}

export async function provisionStore(input: { name: string; slug: string }): Promise<TenantSummary> {
  if (!supabase) throw new Error('Configura Supabase antes de crear una tienda.')
  const name = input.name.trim()
  const slug = slugify(input.slug)
  if (name.length < 2 || name.length > 120) throw new Error('El nombre de la tienda debe tener entre 2 y 120 caracteres.')
  if (slug.length < 3 || slug.length > 50) throw new Error('El subdominio debe tener entre 3 y 50 caracteres.')

  const { data, error } = await supabase.rpc('provision_tenant', {
    p_slug: slug,
    p_store_name: name,
    p_currency_code: 'PEN',
  })
  if (error) {
    if (error.message.includes('duplicate key')) throw new Error('Ese subdominio ya está en uso. Elige otro.')
    if (error.message.includes('verified_email_required')) throw new Error('Confirma tu correo antes de crear la tienda.')
    throw error
  }

  return { id: data as string, slug, name, role: 'owner' }
}
