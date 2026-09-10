import { useEffect, useState } from 'react'

import type { TenantSummary } from '@/modules/onboarding/tenantOnboardingApi'
import { getTenantProducts, setTenantProductStatus, type TenantProductStatus, type TenantProductSummary } from './productAdminApi'

function statusLabel(status: TenantProductStatus): string {
  return { draft: 'Borrador', published: 'Publicado', archived: 'Archivado' }[status]
}

export default function TenantProductsView({ tenant, onCreateProduct, onEditProduct, onBack, onProductCountChange }: {
  tenant: TenantSummary
  onCreateProduct: () => void
  onEditProduct: (productId: string) => void
  onBack: () => void
  onProductCountChange: (count: number) => void
}) {
  const [products, setProducts] = useState<TenantProductSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await getTenantProducts(tenant.slug)
      setProducts(items)
      onProductCountChange(items.filter((item) => item.status !== 'archived').length)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los productos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [tenant.id])

  const changeStatus = async (product: TenantProductSummary, status: TenantProductStatus) => {
    setSavingId(product.id)
    setError(null)
    try {
      await setTenantProductStatus(tenant.slug, product.id, status)
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar el producto.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="min-h-screen bg-graphite px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button onClick={onBack} className="text-sm text-ink-muted transition hover:text-ink">← Volver al dashboard</button>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-brand">Catálogo de {tenant.name}</p>
            <h1 className="mt-2 font-display text-3xl font-black text-ink">Productos</h1>
            <p className="mt-2 text-sm text-ink-secondary">Publica, despublica o archiva productos sin perder el historial.</p>
          </div>
          <button onClick={onCreateProduct} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">Agregar producto</button>
        </div>

        {error && <p role="alert" className="mt-6 rounded-xl border border-offer/30 bg-offer/10 p-3 text-sm text-offer">{error}</p>}
        {loading ? <p className="mt-8 text-sm text-ink-muted">Cargando productos…</p> : products.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-panel p-8 text-center">
            <h2 className="font-display text-xl font-bold text-ink">Todavía no tienes productos</h2>
            <p className="mt-2 text-sm text-ink-secondary">Crea el primero para que aparezca en tu catálogo público.</p>
            <button onClick={onCreateProduct} className="mt-5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">Crear primer producto</button>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/8 bg-panel">
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/8 px-5 py-3 text-xs font-mono uppercase tracking-wider text-ink-muted md:grid-cols-[1fr_120px_110px_130px]">
              <span>Producto</span><span className="hidden md:block">Stock</span><span className="hidden md:block">Estado</span><span>Acciones</span>
            </div>
            {products.map((product) => {
              const isSaving = savingId === product.id
              return <article key={product.id} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/6 px-5 py-4 last:border-0 md:grid-cols-[1fr_120px_110px_130px]">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-ink">{product.name}</h2>
                  <p className="mt-1 text-xs text-ink-muted">{product.category_name ?? 'Sin categoría'} · S/ {(product.starting_price_cents / 100).toFixed(2)} · {product.variant_count} variante{product.variant_count === 1 ? '' : 's'}</p>
                </div>
                <span className="hidden text-sm text-ink-secondary md:block">{product.total_stock}</span>
                <span className="hidden text-xs text-ink-secondary md:block">{statusLabel(product.status)}</span>
                <div className="flex justify-end gap-2">
                  <button disabled={isSaving} onClick={() => onEditProduct(product.id)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-secondary transition hover:bg-elevated disabled:opacity-50">Editar</button>
                  {product.status === 'published' ? <button disabled={isSaving} onClick={() => void changeStatus(product, 'draft')} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-ink-secondary transition hover:bg-elevated disabled:opacity-50">Despublicar</button> : product.status === 'draft' ? <button disabled={isSaving} onClick={() => void changeStatus(product, 'published')} className="rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-xs text-brand transition hover:bg-brand/20 disabled:opacity-50">Publicar</button> : null}
                  {product.status !== 'archived' && <button disabled={isSaving} onClick={() => void changeStatus(product, 'archived')} className="rounded-lg px-2.5 py-1.5 text-xs text-ink-muted transition hover:bg-elevated hover:text-ink disabled:opacity-50">Archivar</button>}
                </div>
              </article>
            })}
          </div>
        )}
      </div>
    </section>
  )
}
