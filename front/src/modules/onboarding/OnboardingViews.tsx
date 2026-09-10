import { useState } from 'react'

import { provisionStore, requestPasswordRecovery, resendStoreConfirmation, signUpStoreOwner, suggestedStoreSlug, type TenantSummary, updateRecoveredPassword } from './tenantOnboardingApi'

const fieldClass = 'mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-elevated px-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-brand'

export default function RegisterView({ onSignedIn, onLogin }: { onSignedIn: () => Promise<void>; onLogin: () => void }) {
  const [form, setForm] = useState({ displayName: '', email: '', password: '' })
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      const result = await signUpStoreOwner(form)
      if (result === 'confirmation_required') {
        setNotice('Revisa tu correo y confirma la cuenta. Luego inicia sesión para crear tu tienda.')
      } else {
        await onSignedIn()
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (!form.email.trim()) {
      setError('Ingresa el correo que usaste para registrarte.')
      return
    }
    setResending(true)
    setError(null)
    try {
      await resendStoreConfirmation(form.email)
      setNotice('Enviamos un nuevo correo de confirmación. Revisa también Spam y Promociones.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo reenviar la confirmación.')
    } finally {
      setResending(false)
    }
  }

  return (
    <section className="min-h-screen bg-graphite px-4 py-12">
      <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-2xl border border-white/8 bg-panel p-6 md:p-8">
        <img src="/brand/storeos-mark-dark.png" alt="StoreOS" className="h-14 w-14 rounded-2xl object-cover" />
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand">Plataforma SaaS</p>
        <h1 className="mt-3 font-display text-3xl font-black text-ink">Crea tu tienda</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">Comienza con una cuenta de propietario. Podrás configurar y publicar tu catálogo después.</p>
        <label className="mt-6 block text-sm font-medium text-ink-secondary">Tu nombre
          <input className={fieldClass} value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required maxLength={120} autoComplete="name" />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink-secondary">Correo electrónico
          <input className={fieldClass} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required autoComplete="email" />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink-secondary">Contraseña
          <input className={fieldClass} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={12} autoComplete="new-password" />
        </label>
        <p className="mt-2 text-xs text-ink-muted">Mínimo 12 caracteres.</p>
        {error && <p role="alert" className="mt-4 text-sm text-offer">{error}</p>}
        {notice && <p role="status" className="mt-4 text-sm text-emerald-400">{notice}</p>}
        {(notice || error) && <button type="button" onClick={() => void resend()} disabled={resending} className="mt-3 text-sm text-brand transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-60">{resending ? 'Reenviando…' : 'Reenviar correo de confirmación'}</button>}
        <button disabled={loading} className="mt-6 h-11 w-full rounded-xl bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Creando cuenta…' : 'Continuar'}
        </button>
        <button type="button" onClick={onLogin} className="mt-4 w-full text-sm text-ink-muted transition hover:text-ink">Ya tengo una cuenta</button>
      </form>
    </section>
  )
}

export function PasswordRecoveryRequestView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await requestPasswordRecovery(email)
      setNotice('Si existe una cuenta para este correo, recibirás instrucciones para restablecer la contraseña. Revisa Spam y Promociones.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo solicitar la recuperación.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen bg-graphite px-4 py-12">
      <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-2xl border border-white/8 bg-panel p-6 md:p-8">
        <img src="/brand/storeos-mark-dark.png" alt="StoreOS" className="h-14 w-14 rounded-2xl object-cover" />
        <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-brand">Recuperar acceso</p>
        <h1 className="mt-3 font-display text-3xl font-black text-ink">Restablece tu contraseña</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">Te enviaremos un enlace seguro al correo registrado.</p>
        <label className="mt-6 block text-sm font-medium text-ink-secondary">Correo electrónico
          <input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        </label>
        {error && <p role="alert" className="mt-4 text-sm text-offer">{error}</p>}
        {notice && <p role="status" className="mt-4 text-sm text-emerald-400">{notice}</p>}
        <button disabled={loading} className="mt-6 h-11 w-full rounded-xl bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Enviando…' : 'Enviar enlace seguro'}</button>
        <button type="button" onClick={onLogin} className="mt-4 w-full text-sm text-ink-muted transition hover:text-ink">Volver a iniciar sesión</button>
      </form>
    </section>
  )
}

export function PasswordRecoveryConfirmView({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await updateRecoveredPassword(password)
      setCompleted(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen bg-graphite px-4 py-12">
      <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-2xl border border-white/8 bg-panel p-6 md:p-8">
        <img src="/brand/storeos-mark-dark.png" alt="StoreOS" className="h-14 w-14 rounded-2xl object-cover" />
        <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-brand">Enlace verificado</p>
        <h1 className="mt-3 font-display text-3xl font-black text-ink">Elige una nueva contraseña</h1>
        <label className="mt-6 block text-sm font-medium text-ink-secondary">Nueva contraseña
          <input className={fieldClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} autoComplete="new-password" />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink-secondary">Confirmar contraseña
          <input className={fieldClass} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={12} autoComplete="new-password" />
        </label>
        {error && <p role="alert" className="mt-4 text-sm text-offer">{error}</p>}
        {completed && <p role="status" className="mt-4 text-sm text-emerald-400">Contraseña actualizada. Ya puedes iniciar sesión.</p>}
        {completed ? <button type="button" onClick={onLogin} className="mt-6 h-11 w-full rounded-xl bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand/90">Ir a iniciar sesión</button> : <button disabled={loading} className="mt-6 h-11 w-full rounded-xl bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Actualizando…' : 'Guardar contraseña'}</button>}
      </form>
    </section>
  )
}

export function StoreSetupView({ onCreated, onSignOut }: { onCreated: (tenant: TenantSummary) => void; onSignOut: () => Promise<void> }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      onCreated(await provisionStore({ name, slug: slug || suggestedStoreSlug(name) }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo crear la tienda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen bg-graphite px-4 py-12">
      <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-2xl border border-white/8 bg-panel p-6 md:p-8">
        <img src="/brand/storeos-mark-dark.png" alt="StoreOS" className="h-14 w-14 rounded-2xl object-cover" />
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand">Paso 1 de 1</p>
        <h1 className="mt-3 font-display text-3xl font-black text-ink">Ponle nombre a tu tienda</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">Se creará un tenant aislado y se te asignará como propietario.</p>
        <label className="mt-6 block text-sm font-medium text-ink-secondary">Nombre de la tienda
          <input className={fieldClass} value={name} onChange={(event) => { const value = event.target.value; setName(value); if (!slugTouched) setSlug(suggestedStoreSlug(value)) }} required maxLength={120} autoFocus />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink-secondary">Subdominio
          <div className="mt-1.5 flex overflow-hidden rounded-xl border border-white/10 bg-elevated focus-within:ring-2 focus-within:ring-brand">
            <input className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(suggestedStoreSlug(event.target.value)) }} required minLength={3} maxLength={50} />
            <span className="flex items-center border-l border-white/10 px-3 font-mono text-xs text-ink-muted">.tienda</span>
          </div>
        </label>
        <p className="mt-2 text-xs text-ink-muted">Solo letras minúsculas, números y guiones. Podrás conectar un dominio propio más adelante.</p>
        {error && <p role="alert" className="mt-4 text-sm text-offer">{error}</p>}
        <button disabled={loading} className="mt-6 h-11 w-full rounded-xl bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Creando tienda…' : 'Crear mi tienda'}
        </button>
        <button type="button" onClick={() => void onSignOut()} className="mt-4 w-full text-sm text-ink-muted transition hover:text-ink">Cerrar sesión</button>
      </form>
    </section>
  )
}

export function TenantDashboardView({ tenant, productCount, onCreateStore, onManageProducts, onCreateProduct, onViewStore, onSignOut }: { tenant: TenantSummary; productCount: number | null; onCreateStore: () => void; onManageProducts: () => void; onCreateProduct: () => void; onViewStore: () => void; onSignOut: () => Promise<void> }) {
  return (
    <section className="min-h-screen bg-graphite px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand">Dashboard de tienda</p>
            <h1 className="mt-2 font-display text-3xl font-black text-ink">{tenant.name}</h1>
            <p className="mt-2 text-sm text-ink-secondary"><span className="font-mono text-ink">{tenant.slug}.tienda</span> · Rol: propietario</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onCreateProduct} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">Agregar producto</button>
            <button onClick={onManageProducts} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-elevated">Gestionar productos</button>
            <button onClick={onViewStore} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-elevated">Ver tienda</button>
            <button onClick={onCreateStore} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-elevated">Nueva tienda</button>
            <button onClick={() => void onSignOut()} className="rounded-xl px-4 py-2 text-sm text-ink-muted transition hover:bg-elevated hover:text-ink">Salir</button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[['Productos', productCount === null ? '—' : String(productCount), 'Gestiona el catálogo, publicación y archivado de tus productos.'], ['Pedidos', '0', 'Las ventas aparecerán aquí.'], ['Estado', 'Activa', 'Tu tenant está aislado y listo para configurar.']].map(([label, value, detail]) => (
            <article key={label} className="rounded-2xl border border-white/8 bg-panel p-5">
              <p className="text-sm text-ink-secondary">{label}</p>
              <p className="mt-3 font-display text-3xl font-black text-ink">{value}</p>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">{detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
