import { useEffect, useMemo, useState } from 'react'

import { getPublishedProducts } from '@/modules/catalog/catalogApi'
import type { Product } from '@/modules/catalog/types'
import { isStorefrontConfigured, isSupabaseConfigured, supabase, tenantSlug } from '@/lib/supabase'
import { createOrder } from '@/modules/orders/orderApi'
import { createMockOrder, getSeedOrders, type CheckoutSubmission, type OrderRecord } from '@/modules/orders/mockBackend'
import RegisterView, { PasswordRecoveryConfirmView, PasswordRecoveryRequestView, StoreSetupView, TenantDashboardView } from '@/modules/onboarding/OnboardingViews'
import { getMyTenants, type TenantSummary } from '@/modules/onboarding/tenantOnboardingApi'
import { createTenantProduct, getTenantProductDetail, getTenantProducts, updateTenantProduct, uploadTenantProductImages, type TenantProductStatus } from '@/modules/products/productAdminApi'
import TenantProductsView from '@/modules/products/TenantProductsView'
import SupportChat from '@/modules/support/SupportChat'
import { hasActiveTenantStaffAccess } from '@/modules/tenancy/tenantAccess'

// ─── Types ─────────────────────────────────────────────────────────────────────

type View = 'saas-home' | 'demo-home' | 'catalog' | 'tenant-catalog' | 'product' | 'checkout' | 'confirmation' | 'register' | 'password-reset-request' | 'password-reset-confirm' | 'onboarding' | 'dashboard' | 'tenant-products' | 'tenant-product' | 'tenant-product-edit' | 'admin-login' | 'admin-orders' | 'admin-product'

interface CartItem {
  product: Product
  quantity: number
}

type Order = OrderRecord

// ─── Data ──────────────────────────────────────────────────────────────────────

const DEMO_PRODUCTS: Product[] = [
  {
    id: '1', variantId: 'demo-1', name: 'Figura Naruto Uzumaki — Modo Sabio', franchise: 'Naruto Shippuden',
    category: 'Figuras', price: 289.90, stock: 'available', stockCount: 12, condition: 'Nuevo',
    images: [
      'https://images.unsplash.com/photo-1614583225154-5fcdda07019e?w=800&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1621478374422-35206faeddfb?w=800&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1714537097791-be0ba0473b9c?w=800&h=800&fit=crop&auto=format',
    ],
    description: 'Figura de colección en escala 1/8 de Naruto Uzumaki en su legendario Modo Sabio. Fabricada en PVC de alta calidad por Banpresto. Incluye peana detallada, efectos de chakra intercambiables y certificado de autenticidad oficial. Altura aproximada 22 cm.',
    brand: 'Banpresto', scale: '1/8', weight: '320g',
  },
  {
    id: '2', variantId: 'demo-2', name: 'Figura Tanjiro Kamado — Concentración Total', franchise: 'Demon Slayer',
    category: 'Figuras', price: 349.00, originalPrice: 429.00, stock: 'deal', stockCount: 5, condition: 'Nuevo',
    images: [
      'https://images.unsplash.com/photo-1705932461994-6fb2b07f27dd?w=800&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1614583225154-5fcdda07019e?w=800&h=800&fit=crop&auto=format',
    ],
    description: 'Figura de resina fina de Tanjiro Kamado en postura de combate. Edición limitada con efectos de agua translúcida. Pintura a mano de alta precisión con acabado premium.',
    brand: 'Good Smile Company', scale: '1/7', weight: '450g',
  },
  {
    id: '3', variantId: 'demo-3', name: 'Manga Dragon Ball Super — Vol. 01–10', franchise: 'Dragon Ball',
    category: 'Manga', price: 189.90, stock: 'last-units', stockCount: 2, condition: 'Nuevo',
    images: [
      'https://images.unsplash.com/photo-1709675577966-6231e5a2ac43?w=800&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1709675577960-0b1e7ba55347?w=800&h=800&fit=crop&auto=format',
    ],
    description: 'Pack completo de los 10 primeros volúmenes de Dragon Ball Super en español. Edición Ivrea, calidad editorial premium. Ideal para iniciar o completar tu colección del arco Tournament of Power.',
    brand: 'Ivrea', weight: '1.2kg',
  },
  {
    id: '4', variantId: 'demo-4', name: 'Figura Levi Ackerman — Edición Capitán ODM', franchise: 'Attack on Titan',
    category: 'Figuras', price: 50.00, originalPrice: 549.00, stock: 'presale', stockCount: 0, condition: 'Nuevo',
    images: [
      'https://images.unsplash.com/photo-1762786613960-96fc8a8d8d6b?w=800&h=800&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1739102174050-85ffaadab43f?w=800&h=800&fit=crop&auto=format',
    ],
    description: 'Figura de preventa del Capitán Levi en su icónica pose de combate con equipo ODM. Fabricada por Kotobukiya con resina de alta calidad. Disponible en dos variantes de base.',
    variants: ['Base Estándar', 'Base Diorama Especial'],
    presaleDate: '28 feb 2025', brand: 'Kotobukiya', scale: '1/6', weight: '580g',
  },
  {
    id: '5', variantId: 'demo-5', name: 'Figura Nezuko Kamado — Forma Demonio', franchise: 'Demon Slayer',
    category: 'Figuras', price: 198.00, stock: 'out-of-stock', stockCount: 0, condition: 'Nuevo',
    images: ['https://images.unsplash.com/photo-1621478374422-35206faeddfb?w=800&h=800&fit=crop&auto=format'],
    description: 'Figura de Nezuko en su forma demónica con el bambú característico. Pintura detallada con efectos de llama rosada. Agotada — activa la alerta de restock.',
    brand: 'Aniplex', scale: '1/8', weight: '280g',
  },
  {
    id: '6', variantId: 'demo-6', name: 'Cómic Marvel — Avengers: Endgame #1', franchise: 'Marvel',
    category: 'Cómics', price: 89.90, originalPrice: 119.90, stock: 'deal', stockCount: 8, condition: 'Nuevo',
    images: ['https://images.unsplash.com/photo-1569701813229-33284b643e3c?w=800&h=800&fit=crop&auto=format'],
    description: 'Edición coleccionable del primer número de Avengers: Endgame. Portada variante exclusiva en papel premium con sobrecubierta holográfica y firma del artista.',
    brand: 'Marvel Comics', weight: '120g',
  },
  {
    id: '7', variantId: 'demo-7', name: 'Figura Goku Ultra Instinto — Caja Dañada', franchise: 'Dragon Ball',
    category: 'Figuras', price: 159.90, originalPrice: 249.90, stock: 'damaged-box', stockCount: 1, condition: 'Caja Dañada',
    images: ['https://images.unsplash.com/photo-1714537097791-be0ba0473b9c?w=800&h=800&fit=crop&auto=format'],
    description: 'Figura de Goku en estado Ultra Instinto en perfecto estado. Solo la caja exterior presenta una abolladura menor en una esquina. Precio especial por este motivo.',
    brand: 'Banpresto', scale: '1/8', weight: '380g',
  },
  {
    id: '8', variantId: 'demo-8', name: 'Manga One Piece — Arco de Wano (Vol. 90–105)', franchise: 'One Piece',
    category: 'Manga', price: 459.00, stock: 'available', stockCount: 15, condition: 'Nuevo',
    images: ['https://images.unsplash.com/photo-1709675577960-0b1e7ba55347?w=800&h=800&fit=crop&auto=format'],
    description: 'Pack completo del arco de Wano, los volúmenes más épicos de One Piece. Edición en español, calidad Panini. Incluye lámina de arte exclusiva firmada por el editor.',
    brand: 'Panini', weight: '2.1kg',
  },
]

const ORDERS: Order[] = getSeedOrders()

// ─── Utilities ─────────────────────────────────────────────────────────────────

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

function readPublicStoreSlug(): string | undefined {
  const candidate = new URLSearchParams(window.location.search).get('store')?.trim().toLowerCase()
  return candidate && /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(candidate) ? candidate : undefined
}

async function createLiveOrder(storeSlug: string, submission: CheckoutSubmission, cart: CartItem[]): Promise<OrderRecord> {
  const idempotencyKey = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const created = await createOrder(storeSlug, {
    idempotencyKey,
    customer: {
      name: submission.name,
      email: submission.email || undefined,
      phone: submission.phone,
      documentNumber: submission.dni || undefined,
    },
    delivery: {
      method: submission.delivery,
      address: submission.address || undefined,
      district: submission.district || undefined,
    },
    payment: { method: submission.payment },
    items: cart.map((item) => ({ variantId: item.product.variantId, quantity: item.quantity })),
  })

  const paymentDetails = {
    yape: { label: 'Yape', recipient: 'AnimeGeek Demo', reference: '987 654 321' },
    plin: { label: 'Plin', recipient: 'AnimeGeek Demo', reference: '987 654 321' },
    transfer: { label: 'Transferencia bancaria', recipient: 'BCP', reference: 'Cta. 193-12345678-0-28' },
  }[submission.payment]
  const reserveDate = new Date(created.reserveExpiresAt)
  const dateFormatter = new Intl.DateTimeFormat('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'America/Lima',
  })

  return {
    id: created.orderId,
    code: created.orderNumber,
    customer: submission.name,
    customerPhone: submission.phone.replace(/\D/g, ''),
    email: submission.email,
    total: created.totalCents / 100,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: paymentDetails.label,
    date: dateFormatter.format(new Date()),
    itemCount: cart.reduce((total, item) => total + item.quantity, 0),
    reserveExpiry: dateFormatter.format(reserveDate),
    reserveExpiryLabel: dateFormatter.format(reserveDate),
    alertType: 'expiring',
    whatsappUrl: `https://wa.me/${created.whatsappNumber}?text=${encodeURIComponent(created.whatsappMessage)}`,
    paymentInstructions: { ...paymentDetails, amount: created.totalCents / 100 },
  }
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

const IconCart = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M2.5 2.5h2l2.5 10h8l2-6H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="16.5" r="1.25" fill="currentColor"/>
    <circle cx="14" cy="16.5" r="1.25" fill="currentColor"/>
  </svg>
)

const IconSearch = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const IconClose = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const IconChevRight = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconChevLeft = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="m10 4-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconCheck = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="m4 10 5 5 7-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconShield = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2 4 5v5c0 3.5 2.5 6.5 6 7 3.5-.5 6-3.5 6-7V5l-6-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="m7.5 10 2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconTruck = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="1.5" y="6" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12.5 9h3l2.5 3v2h-5.5V9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="5" cy="15.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="15" cy="15.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const IconStar = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill={filled ? 'currentColor' : 'none'}>
    <path d="M7 1l1.5 3.5 3.5.5-2.5 2.5.5 3.5L7 9.5 4 11l.5-3.5L2 5l3.5-.5L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
)

const IconWhatsapp = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M10 1.5a8.5 8.5 0 0 1 7.368 12.754L18.5 18.5l-4.31-1.127A8.5 8.5 0 1 1 10 1.5ZM6.75 6.75a.75.75 0 0 0-.75.75v.75c0 .3.11.58.3.8l.82 1.04c.35.67.82 1.27 1.38 1.75l.35-.38c.28-.32.67-.51 1.08-.51H11a.75.75 0 0 1 .75.75v.25A1.75 1.75 0 0 1 10 13.5c-2.9 0-5.25-3-5.25-5.5v-.5a2.25 2.25 0 0 1 2.25-2.25h.5a.75.75 0 0 1 .75.75v.25a.75.75 0 0 1-.75.75h-.5Z"/>
  </svg>
)

// ─── Shared Components ─────────────────────────────────────────────────────────

function StockBadge({ status, count }: { status: Product['stock']; count?: number }) {
  const configs: Record<Product['stock'], { label: string; cls: string }> = {
    available:      { label: 'Disponible',             cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    'last-units':   { label: `Últimas ${count ?? ''}`, cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    'out-of-stock': { label: 'Agotado',                cls: 'bg-white/5 text-white/35 border-white/10' },
    presale:        { label: 'Preventa',               cls: 'bg-brand/15 text-brand-light border-brand/25' },
    deal:           { label: 'Oferta',                 cls: 'bg-offer/15 text-offer border-offer/25' },
    'damaged-box':  { label: 'Caja Dañada',            cls: 'bg-amber-700/15 text-amber-500 border-amber-700/25' },
  }
  const { label, cls } = configs[status]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border font-mono tracking-wide', cls)}>
      {label}
    </span>
  )
}

function Btn({
  variant = 'primary', size = 'md', className, onClick, children, disabled, type = 'button', fullWidth,
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'deal' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
  type?: 'button' | 'submit'
  fullWidth?: boolean
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-graphite disabled:opacity-40 disabled:pointer-events-none select-none'
  const variants = {
    primary:     'bg-brand text-white hover:bg-brand-dim active:scale-[0.98] shadow-lg shadow-brand/20',
    secondary:   'bg-elevated text-ink border border-white/10 hover:border-white/20 hover:bg-panel',
    ghost:       'text-ink-secondary hover:text-ink hover:bg-elevated',
    deal:        'bg-offer text-white hover:bg-offer-dim active:scale-[0.98] shadow-lg shadow-offer/20',
    outline:     'border border-brand text-brand hover:bg-brand/10',
    destructive: 'bg-offer/10 text-offer border border-offer/20 hover:bg-offer/20',
  }
  const sizes = { sm: 'h-9 px-3.5 text-sm gap-1.5', md: 'h-11 px-5 text-sm gap-2', lg: 'h-12 px-6 text-base gap-2' }
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

function Input({
  label, placeholder, value, onChange, error, type = 'text', required, hint,
}: {
  label?: string; placeholder?: string; value?: string; onChange?: (v: string) => void
  error?: string; type?: string; required?: boolean; hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-ink-secondary">
          {label}{required && <span className="text-offer ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      <input
        type={type} value={value} onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder} required={required} aria-invalid={!!error}
        className={cn(
          'h-11 px-4 rounded-xl bg-elevated border text-ink placeholder:text-ink-muted/50 text-sm transition-colors w-full',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent',
          error ? 'border-offer' : 'border-white/8 hover:border-white/16'
        )}
      />
      {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
      {error && <p className="text-xs text-offer" role="alert">{error}</p>}
    </div>
  )
}

function Stepper({ value, onChange, min = 1, max = 99 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-white/8 overflow-hidden" role="group" aria-label="Cantidad">
      <button onClick={() => onChange(Math.max(min, value - 1))} className="h-11 w-11 flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand" aria-label="Disminuir">
        <svg width="12" height="2" viewBox="0 0 12 2" fill="none"><path d="M1 1h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
      <span className="h-11 w-10 flex items-center justify-center text-sm font-mono font-semibold text-ink border-x border-white/8" aria-live="polite">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="h-11 w-11 flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand" aria-label="Aumentar">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
    </div>
  )
}

function ProductCard({ product, onNavigate, onAddToCart }: {
  product: Product; onNavigate: (v: View, id?: string) => void; onAddToCart: (p: Product, quantity?: number) => void
}) {
  const isUnavailable = product.stock === 'out-of-stock'
  const isDeal = product.stock === 'deal' || product.stock === 'damaged-box'
  const isPresale = product.stock === 'presale'
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  return (
    <article
      className="group bg-panel rounded-2xl overflow-hidden border border-white/6 hover:border-brand/40 transition-all duration-200 cursor-pointer"
      onClick={() => onNavigate('product', product.id)}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onNavigate('product', product.id)}
      aria-label={`Ver ${product.name}`}
    >
      <div className="relative aspect-square bg-elevated overflow-hidden">
        <img
          src={product.images[0]} alt={product.name}
          className={cn('w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]', isUnavailable && 'grayscale opacity-40')}
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <StockBadge status={product.stock} count={product.stockCount} />
          {product.condition !== 'Nuevo' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-700/15 text-amber-500 border-amber-700/25 font-mono">
              {product.condition}
            </span>
          )}
        </div>
        {isDeal && discount > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <span className="bg-offer text-white text-xs font-bold px-2 py-1 rounded-lg font-mono">-{discount}%</span>
          </div>
        )}
        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-graphite/75 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-xs font-mono text-white/50">Sin stock</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2">
        <div>
          <p className="text-[10px] text-ink-muted font-mono uppercase tracking-widest">{product.franchise}</p>
          <h3 className="text-sm font-medium text-ink leading-snug line-clamp-2 mt-0.5">{product.name}</h3>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            {isPresale ? (
              <>
                <p className="text-[10px] text-ink-muted font-mono">Reserva desde</p>
                <p className="text-base font-bold text-brand font-display">S/ 50.00</p>
              </>
            ) : (
              <>
                {product.originalPrice && <p className="text-[11px] text-ink-muted line-through font-mono">S/ {product.originalPrice.toFixed(2)}</p>}
                <p className={cn('text-base font-bold font-display', isDeal ? 'text-offer' : 'text-ink')}>
                  S/ {product.price.toFixed(2)}
                </p>
              </>
            )}
          </div>
          {!isUnavailable && (
            <button
              onClick={e => { e.stopPropagation(); onAddToCart(product) }}
              className="h-9 w-9 flex-shrink-0 flex items-center justify-center bg-brand/10 text-brand rounded-xl hover:bg-brand hover:text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={`Agregar ${product.name} al carrito`}
            >
              <IconCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Navbar ────────────────────────────────────────────────────────────────────

function Navbar({ view, cartCount, hasAdminAccess, hasWorkspace, onNavigate, onCartOpen }: {
  view: View; cartCount: number; hasAdminAccess: boolean; hasWorkspace: boolean; onNavigate: (v: View) => void; onCartOpen: () => void
}) {
  const isAdmin = view === 'admin-orders' || view === 'admin-product'
  const isDemo = view === 'demo-home' || view === 'catalog' || view === 'tenant-catalog' || view === 'product' || view === 'checkout' || view === 'confirmation'
  return (
    <header className="sticky top-0 z-40 bg-graphite/96 backdrop-blur-md border-b border-white/6">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <button onClick={() => onNavigate('saas-home')} className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xl p-1" aria-label="StoreOS — Inicio">
          <img src="/brand/storeos-mark-dark.png" alt="" className="h-8 w-8 rounded-lg object-cover" />
          <span className="text-base font-bold text-ink font-display tracking-tight">Store<span className="text-brand">OS</span></span>
          {isAdmin && <span className="text-[10px] font-mono text-ink-muted bg-elevated border border-white/8 px-1.5 py-0.5 rounded ml-0.5">Admin</span>}
        </button>

        <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
          {([['Inicio','saas-home'],['Ver demo','demo-home']] as [string,View][]).map(([label, v]) => (
            <button key={v} onClick={() => onNavigate(v)}
              className={cn('px-3 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                view === v ? 'text-ink bg-elevated' : 'text-ink-secondary hover:text-ink hover:bg-elevated/60'
              )}
              aria-current={view === v ? 'page' : undefined}
            >{label}</button>
          ))}
          <button onClick={() => onNavigate(hasAdminAccess ? 'admin-orders' : 'admin-login')}
            className={cn('px-3 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              isAdmin ? 'text-ink bg-elevated' : 'text-ink-secondary hover:text-ink hover:bg-elevated/60'
            )}
          >{hasAdminAccess ? 'Panel demo' : 'Acceder'}</button>
          <button onClick={() => onNavigate(hasWorkspace ? 'dashboard' : 'register')}
            className={cn('px-3 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              view === 'dashboard' || view === 'onboarding' || view === 'register' ? 'text-ink bg-elevated' : 'text-ink-secondary hover:text-ink hover:bg-elevated/60'
            )}
          >{hasWorkspace ? 'Mis tiendas' : 'Crear tienda'}</button>
        </nav>

        <div className="flex items-center gap-1">
          <button onClick={() => onNavigate(hasAdminAccess ? 'admin-orders' : 'admin-login')} className="md:hidden h-10 w-10 flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-elevated rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label={hasAdminAccess ? 'Abrir panel administrativo' : 'Iniciar sesión'}>
            <IconShield className="w-[18px] h-[18px]" />
          </button>
          {isDemo && <button onClick={() => onNavigate('catalog')} className="h-10 w-10 flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-elevated rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Buscar">
            <IconSearch className="w-[18px] h-[18px]" />
          </button>}
          {isDemo && <button onClick={onCartOpen} className="relative h-10 w-10 flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-elevated rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label={`Carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}`}>
            <IconCart className="w-[18px] h-[18px]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand rounded-full text-[10px] font-bold font-mono text-white flex items-center justify-center">{cartCount > 9 ? '9+' : cartCount}</span>
            )}
          </button>}
        </div>
      </div>
    </header>
  )
}

// ─── Cart Sidebar ──────────────────────────────────────────────────────────────

function CartSidebar({ cart, onClose, onUpdateQty, onRemove, onCheckout }: {
  cart: CartItem[]; onClose: () => void; onUpdateQty: (id: string, qty: number) => void; onRemove: (id: string) => void; onCheckout: () => void
}) {
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)
  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Carrito de compras">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="w-full max-w-sm bg-panel flex flex-col border-l border-white/8 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h2 className="text-base font-bold text-ink font-display">Carrito</h2>
            {itemCount > 0 && <p className="text-xs text-ink-muted font-mono mt-0.5">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</p>}
          </div>
          <button onClick={onClose} className="h-9 w-9 flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-elevated rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Cerrar carrito">
            <IconClose />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-elevated border border-white/8 flex items-center justify-center">
              <IconCart className="w-7 h-7 text-ink-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Tu carrito está vacío</p>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">Agrega productos desde el catálogo para comenzar tu pedido.</p>
            </div>
            <Btn variant="secondary" size="sm" onClick={onClose}>Explorar catálogo</Btn>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y divide-white/6">
              {cart.map(item => (
                <div key={item.product.id} className="flex gap-3 p-4">
                  <div className="w-16 h-16 rounded-xl bg-elevated overflow-hidden flex-shrink-0 border border-white/6">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div>
                      <p className="text-[10px] text-ink-muted font-mono truncate">{item.product.franchise}</p>
                      <p className="text-sm font-medium text-ink leading-snug line-clamp-2">{item.product.name}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Stepper value={item.quantity} onChange={qty => onUpdateQty(item.product.id, qty)} min={1} max={item.product.stock === 'presale' ? 10 : item.product.stockCount} />
                      <button onClick={() => onRemove(item.product.id)} className="text-xs text-ink-muted hover:text-offer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded px-1" aria-label={`Eliminar ${item.product.name}`}>
                        Quitar
                      </button>
                    </div>
                    <p className={cn('text-sm font-bold font-display', item.product.stock === 'deal' || item.product.stock === 'damaged-box' ? 'text-offer' : 'text-ink')}>
                      S/ {(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/8 p-5 flex flex-col gap-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-ink-secondary">Subtotal</span>
                <span className="text-xl font-black text-ink font-display">S/ {subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-ink-muted">Envío calculado en el checkout.</p>
              <Btn variant="primary" size="lg" fullWidth onClick={onCheckout}>
                Ir al checkout <IconChevRight />
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Home View ─────────────────────────────────────────────────────────────────

function SaasHomeView({ onNavigate }: { onNavigate: (v: View) => void }) {
  return (
    <section className="min-h-screen overflow-hidden bg-graphite">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div>
          <img src="/brand/storeos-logo-horizontal.png" alt="StoreOS — Tu negocio. Sin límites." className="h-auto w-full max-w-md rounded-2xl bg-white p-2" />
          <p className="mt-4 inline-flex rounded-full border border-brand/30 bg-brand/10 px-3 py-1 font-mono text-xs text-brand">PLATAFORMA SAAS PARA COMERCIO</p>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-black leading-[1.05] text-ink md:text-6xl">Crea y administra tu <span className="text-brand">tienda online</span> sin depender de un nicho.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-secondary">StoreOS es una plataforma personalizable para cualquier negocio: moda, alimentos, tecnología, coleccionables o tu próximo producto.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => onNavigate('register')} className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand/90">Crear mi tienda</button>
            <button onClick={() => onNavigate('demo-home')} className="rounded-xl border border-white/12 bg-elevated px-5 py-3 text-sm font-bold text-ink transition hover:border-brand/40">Iniciar tienda DEMO</button>
          </div>
          <p className="mt-4 text-xs text-ink-muted">La demo usa AnimeGeek solo como ejemplo de una tienda creada con StoreOS.</p>
        </div>
        <div className="relative rounded-3xl border border-white/10 bg-panel p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/8 pb-4">
            <div><p className="font-display text-lg font-bold text-ink">Tu negocio</p><p className="mt-1 text-xs text-ink-muted">Panel de propietario</p></div>
            <span className="rounded-lg bg-emerald-400/10 px-2 py-1 font-mono text-xs text-emerald-400">ACTIVA</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[['Productos', '24'], ['Pedidos', '8'], ['Clientes', '126'], ['Ventas', 'S/ 4,820']].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-elevated p-4"><p className="text-xs text-ink-muted">{label}</p><p className="mt-2 font-display text-2xl font-black text-ink">{value}</p></div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-brand/20 bg-brand/8 p-4"><p className="text-sm font-semibold text-ink">Tu tienda, tu identidad</p><p className="mt-1 text-xs leading-relaxed text-ink-secondary">Configura nombre, colores, catálogo y dominio sin afectar a otros negocios.</p></div>
        </div>
      </div>
      <div className="border-y border-white/8 bg-panel/50">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-10 md:grid-cols-3">
          {[['1. Crea tu cuenta', 'Regístrate y valida tu correo.'], ['2. Configura tu tienda', 'Elige nombre y subdominio propio.'], ['3. Publica y vende', 'Agrega productos y compártelos con clientes.']].map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-white/8 bg-graphite p-5"><h2 className="font-display text-lg font-bold text-ink">{title}</h2><p className="mt-2 text-sm leading-relaxed text-ink-secondary">{text}</p></article>
          ))}
        </div>
      </div>
      <footer className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-8 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
        <img src="/brand/storeos-logo-horizontal.png" alt="StoreOS" className="h-9 w-auto rounded-lg bg-white p-1" />
        <span>Una plataforma de SoftNanTec</span>
        <span>storeos.app</span>
      </footer>
    </section>
  )
}

function HomeView({ products, onNavigate, onAddToCart }: { products: Product[]; onNavigate: (v: View, id?: string) => void; onAddToCart: (p: Product, quantity?: number) => void }) {
  const newArrivals = products.filter(p => p.stock === 'available' || p.stock === 'last-units')
  const presales = products.filter(p => p.stock === 'presale')
  const deals = products.filter(p => p.stock === 'deal' || p.stock === 'damaged-box')

  const cats = [
    { name: 'Figuras', icon: '🗿', count: 142 },
    { name: 'Manga', icon: '📚', count: 87 },
    { name: 'Cómics', icon: '💥', count: 65 },
    { name: 'Funko Pop', icon: '🎭', count: 203 },
    { name: 'Accesorios', icon: '🎒', count: 48 },
    { name: 'Preventas', icon: '⚡', count: 12 },
  ]

  return (
    <div className="min-h-screen bg-graphite">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px] flex items-center">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1739102174050-85ffaadab43f?w=1600&h=900&fit=crop&auto=format" alt="" className="w-full h-full object-cover opacity-18" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/88 to-graphite/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite via-transparent to-transparent" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-brand/18 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-spark/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20 w-full">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/12 border border-brand/25 text-brand text-xs font-mono font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse flex-shrink-0" />
              TIENDA DEMO · AnimeGeek creado con StoreOS
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-ink font-display leading-[1.08] tracking-tight mb-4">
              Tu archivo de<br />
              <span className="text-brand">cultura geek</span>
            </h1>
            <p className="text-base md:text-lg text-ink-secondary leading-relaxed mb-7 max-w-md">
              Figuras, manga, cómics y coleccionables auténticos. Curados para el coleccionista que exige calidad.
            </p>
            <div className="flex flex-wrap gap-3">
              <Btn variant="primary" size="lg" onClick={() => onNavigate('catalog')}>Ver catálogo <IconChevRight /></Btn>
              <Btn variant="secondary" size="lg" onClick={() => onNavigate('catalog')}>Preventas activas</Btn>
            </div>
            <div className="flex flex-wrap gap-5 mt-8 pt-7 border-t border-white/8">
              {['+5,000 pedidos entregados','100% auténticos','Envío a todo el Perú'].map(t => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-ink-secondary">
                  <span className="text-brand font-bold">✓</span>{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-ink font-display">Categorías</h2>
          <button onClick={() => onNavigate('catalog')} className="text-xs text-brand hover:text-brand-light font-medium transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded">
            Ver todo <IconChevRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {cats.map(cat => (
            <button key={cat.name} onClick={() => onNavigate('catalog')}
              className="group flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl bg-panel border border-white/6 hover:border-brand/35 hover:bg-elevated transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <div className="w-10 h-10 rounded-xl bg-elevated border border-white/8 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-200">{cat.icon}</div>
              <span className="text-xs font-medium text-ink-secondary group-hover:text-ink transition-colors">{cat.name}</span>
              <span className="text-[10px] text-ink-muted font-mono">{cat.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Novedades */}
      <section className="py-10 border-t border-white/6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-ink font-display">Novedades</h2>
              <p className="text-xs text-ink-muted mt-0.5">Recién llegados al archivo</p>
            </div>
            <button onClick={() => onNavigate('catalog')} className="text-xs text-brand hover:text-brand-light font-medium transition-colors flex items-center gap-1">Ver todo <IconChevRight className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {newArrivals.slice(0, 4).map(p => <ProductCard key={p.id} product={p} onNavigate={onNavigate} onAddToCart={onAddToCart} />)}
          </div>
        </div>
      </section>

      {/* Preventas */}
      {presales.length > 0 && (
        <section className="py-10 border-t border-white/6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              <span className="text-xs text-brand font-mono font-medium uppercase tracking-widest">Próximamente</span>
            </div>
            <h2 className="text-lg font-bold text-ink font-display mb-5">Preventas Activas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {presales.map(p => (
                <div key={p.id} className="group bg-panel rounded-2xl border border-brand/20 hover:border-brand/45 overflow-hidden cursor-pointer transition-all duration-200" onClick={() => onNavigate('product', p.id)}>
                  <div className="relative aspect-video bg-elevated overflow-hidden">
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover opacity-65 group-hover:opacity-85 group-hover:scale-[1.04] transition-all duration-400" />
                    <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand text-white text-xs font-medium font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />Preventa
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] text-ink-muted font-mono uppercase tracking-widest">{p.franchise}</p>
                    <h3 className="text-sm font-semibold text-ink mt-0.5 font-display">{p.name}</h3>
                    <div className="flex items-end justify-between mt-3">
                      <div>
                        <p className="text-[10px] text-ink-muted font-mono">Reserva desde</p>
                        <p className="text-base font-bold text-brand font-display">S/ 50.00</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-ink-muted font-mono">Entrega est.</p>
                        <p className="text-xs text-ink-secondary font-medium">{p.presaleDate}</p>
                      </div>
                    </div>
                    <Btn variant="outline" size="sm" fullWidth className="mt-3" onClick={() => onNavigate('product', p.id)}>Reservar ahora</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ofertas */}
      {deals.length > 0 && (
        <section className="py-10 border-t border-white/6" style={{ background: 'linear-gradient(to bottom, rgba(244,63,94,0.03) 0%, transparent 100%)' }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-offer animate-pulse" />
                  <span className="text-xs text-offer font-mono font-medium uppercase tracking-widest">Tiempo limitado</span>
                </div>
                <h2 className="text-lg font-bold text-ink font-display">Ofertas del día</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-offer bg-offer/10 border border-offer/20 px-3 py-1.5 rounded-xl">⏱ 18:32:07</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {deals.map(p => <ProductCard key={p.id} product={p} onNavigate={onNavigate} onAddToCart={onAddToCart} />)}
            </div>
          </div>
        </section>
      )}

      {/* Benefits — ivory */}
      <section className="bg-ivory py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-graphite font-display">Por qué elegir AnimeGeek</h2>
            <p className="text-sm text-graphite/55 mt-2">El archivo de confianza para el coleccionista peruano</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: <IconShield className="w-5 h-5" />, title: 'Autenticidad garantizada', desc: 'Todos los productos son originales con certificado de autenticidad verificable.' },
              { icon: <IconTruck className="w-5 h-5" />, title: 'Envío seguro', desc: 'Empaque especializado para figuras. Seguimiento en tiempo real con Olva y Shalom.' },
              { icon: <span className="text-lg">🤝</span>, title: 'Soporte personalizado', desc: 'Atención por WhatsApp de lun–sáb de 9 am a 8 pm. Resolvemos todo.' },
              { icon: <span className="text-lg">💳</span>, title: 'Pago fácil', desc: 'Yape, Plin, transferencia bancaria y reserva con depósito mínimo.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3 p-5 rounded-2xl bg-white/60 border border-graphite/8">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center">{icon}</div>
                <div>
                  <h3 className="text-sm font-bold text-graphite">{title}</h3>
                  <p className="text-xs text-graphite/55 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="text-lg font-bold text-ink font-display mb-7 text-center">Lo que dicen los coleccionistas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Rodrigo M.', loc: 'Lima', stars: 5, text: 'Increíble calidad. La figura llegó perfectamente embalada y es 100% original. Ya hice tres pedidos y siempre impecable.' },
            { name: 'Valeria Q.', loc: 'Arequipa', stars: 5, text: 'El proceso de preventa es muy claro. Excelente seguimiento del envío y soporte por WhatsApp súper rápido.' },
            { name: 'Sebastián T.', loc: 'Cusco', stars: 5, text: 'Por fin una tienda peruana de coleccionables profesional. Precios justos, catálogo enorme y atención de primera.' },
          ].map(r => (
            <div key={r.name} className="bg-panel rounded-2xl p-5 border border-white/6">
              <div className="flex gap-0.5 mb-3">{Array.from({length:5}).map((_,i) => <IconStar key={i} className="w-3.5 h-3.5 text-amber-400" filled={i<r.stars} />)}</div>
              <p className="text-sm text-ink-secondary leading-relaxed mb-4">"{r.text}"</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-xs font-bold text-brand">{r.name[0]}</div>
                <div>
                  <p className="text-xs font-semibold text-ink">{r.name}</p>
                  <p className="text-[10px] text-ink-muted font-mono">{r.loc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-white/8">
          {[{v:'+5,000',l:'pedidos entregados',c:'text-brand'},{v:'4.9/5',l:'calificación promedio',c:'text-amber-400'},{v:'100%',l:'productos auténticos',c:'text-spark'}].map(s => (
            <div key={s.l} className="text-center">
              <p className={cn('text-2xl md:text-3xl font-black font-display', s.c)}>{s.v}</p>
              <p className="text-xs text-ink-muted mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <img src="/brand/storeos-mark-dark.png" alt="StoreOS" className="h-7 w-7 rounded-lg object-cover" />
            <span className="font-bold text-ink font-display text-sm">ANIMEGEEK</span>
            <span>· Tienda DEMO</span>
          </div>
          <p>Demo de StoreOS · Diseñado y desarrollado por SoftNanTec</p>
          <div className="flex gap-4">
            <button className="hover:text-ink transition-colors">Envíos</button>
            <button className="hover:text-ink transition-colors">Devoluciones</button>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Catalog View ──────────────────────────────────────────────────────────────

function CatalogView({ products, onNavigate, onAddToCart, storeSlug }: { products: Product[]; onNavigate: (v: View, id?: string) => void; onAddToCart: (p: Product, quantity?: number) => void; storeSlug?: string }) {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('featured')

  const demoCategories = ['Figuras', 'Manga', 'Cómics', 'Funko Pop', 'Accesorios']
  const isTenantCatalog = Boolean(storeSlug && storeSlug !== tenantSlug)
  const categories = isTenantCatalog
    ? [...new Set(products.map((product) => product.category).filter(Boolean))].sort()
    : demoCategories
  const stockFilters = [
    {value:'available',label:'Disponible'},{value:'last-units',label:'Últimas unidades'},
    {value:'presale',label:'Preventa'},{value:'deal',label:'Oferta'},{value:'damaged-box',label:'Caja dañada'},
  ]

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !search || p.name.toLowerCase().includes(q) || p.franchise.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    const matchCat = !selectedCat || p.category === selectedCat
    const matchStock = !selectedStock || p.stock === selectedStock
    return matchQ && matchCat && matchStock
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  const hasFilters = !!(selectedCat || selectedStock)

  const FilterPanel = () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-widest font-mono mb-2.5">Categoría</p>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => setSelectedCat(null)} className={cn('text-left px-3 py-2 rounded-xl text-sm transition-colors', !selectedCat ? 'bg-brand/12 text-brand font-medium' : 'text-ink-secondary hover:text-ink hover:bg-elevated')}>Todas las categorías</button>
          {categories.map(c => (
            <button key={c} onClick={() => setSelectedCat(c === selectedCat ? null : c)} className={cn('text-left px-3 py-2 rounded-xl text-sm transition-colors', selectedCat === c ? 'bg-brand/12 text-brand font-medium' : 'text-ink-secondary hover:text-ink hover:bg-elevated')}>{c}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-widest font-mono mb-2.5">Disponibilidad</p>
        <div className="flex flex-col gap-0.5">
          {stockFilters.map(f => (
            <button key={f.value} onClick={() => setSelectedStock(f.value === selectedStock ? null : f.value)} className={cn('flex items-center gap-2.5 text-left px-3 py-2 rounded-xl text-sm transition-colors', selectedStock === f.value ? 'bg-brand/12 text-brand font-medium' : 'text-ink-secondary hover:text-ink hover:bg-elevated')}>
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', selectedStock === f.value ? 'bg-brand' : 'bg-ink-muted/40')} />
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {hasFilters && (
        <button onClick={() => { setSelectedCat(null); setSelectedStock(null) }} className="text-xs text-offer hover:text-offer-dim font-medium transition-colors text-left px-3">Limpiar filtros</button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-graphite">
      <div className="sticky top-14 z-30 bg-graphite/96 backdrop-blur-md border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
            <input type="search" placeholder={isTenantCatalog ? 'Buscar productos...' : 'Buscar figuras, manga, franquicias...'} value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar productos"
              className="h-10 pl-9 pr-4 rounded-xl bg-panel border border-white/8 text-sm text-ink placeholder:text-ink-muted/55 w-full focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Ordenar por" className="h-10 px-3 rounded-xl bg-panel border border-white/8 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand hidden sm:block">
            <option value="featured">Destacados</option>
            <option value="price-asc">Precio ↑</option>
            <option value="price-desc">Precio ↓</option>
            <option value="name">A-Z</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}
            className={cn('h-10 px-3 rounded-xl text-sm font-medium border transition-colors flex items-center gap-1.5 flex-shrink-0', showFilters ? 'bg-brand/12 text-brand border-brand/30' : 'bg-panel text-ink-secondary border-white/8 hover:text-ink')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span className="hidden sm:block">Filtros</span>
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isTenantCatalog && (
          <div className="mb-6 rounded-2xl border border-white/8 bg-panel p-5">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-brand">Tienda creada con StoreOS</p>
            <h1 className="mt-2 font-display text-2xl font-black text-ink">Catálogo de {storeSlug}</h1>
            <p className="mt-2 text-sm text-ink-secondary">Productos publicados por esta tienda. El checkout se habilitará cuando el comercio configure sus pagos.</p>
          </div>
        )}
        <div className="flex gap-6">
          {showFilters && (
            <aside className="hidden md:block w-52 flex-shrink-0">
              <div className="sticky top-32"><FilterPanel /></div>
            </aside>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-ink-muted font-mono">
                {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
                {(hasFilters || search) && ' encontrados'}
              </p>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-8 px-2 rounded-lg bg-panel border border-white/8 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand sm:hidden">
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio ↑</option>
                <option value="price-desc">Precio ↓</option>
                <option value="name">A-Z</option>
              </select>
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-panel border border-white/8 flex items-center justify-center text-2xl">🔍</div>
                <div>
                  <p className="font-semibold text-ink">Sin resultados</p>
                  <p className="text-sm text-ink-muted mt-1">Intenta con otros términos o limpia los filtros.</p>
                </div>
                <Btn variant="secondary" onClick={() => { setSearch(''); setSelectedCat(null); setSelectedStock(null) }}>Limpiar búsqueda</Btn>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {filtered.map(p => <ProductCard key={p.id} product={p} onNavigate={onNavigate} onAddToCart={onAddToCart} />)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="flex-1 bg-black/60" onClick={() => setShowFilters(false)} aria-hidden="true" />
          <div className="w-72 bg-panel h-full overflow-y-auto p-5 border-l border-white/8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-ink font-display">Filtros</h2>
              <button onClick={() => setShowFilters(false)} className="h-9 w-9 flex items-center justify-center text-ink-secondary hover:text-ink rounded-xl hover:bg-elevated transition-colors" aria-label="Cerrar filtros">
                <IconClose />
              </button>
            </div>
            <FilterPanel />
            <Btn variant="primary" fullWidth className="mt-8" onClick={() => setShowFilters(false)}>Ver {filtered.length} productos</Btn>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Product View ──────────────────────────────────────────────────────────────

function ProductView({ products, productId, onNavigate, onAddToCart }: { products: Product[]; productId: string; onNavigate: (v: View, id?: string) => void; onAddToCart: (p: Product, quantity?: number) => void }) {
  const product = products.find(p => p.id === productId) ?? products[0]
  const [selImg, setSelImg] = useState(0)
  const [selVariant, setSelVariant] = useState(product.variants?.[0] ?? '')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const isUnavailable = product.stock === 'out-of-stock'
  const isDeal = product.stock === 'deal' || product.stock === 'damaged-box'
  const isPresale = product.stock === 'presale'
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0
  const priceDisplay = isPresale ? 'S/ 50.00' : `S/ ${product.price.toFixed(2)}`
  const priceLabel = isPresale ? 'Reserva desde' : isDeal ? 'Precio oferta' : 'Precio'

  const handleAdd = () => {
    onAddToCart(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  const related = products.filter(p => p.id !== product.id && p.franchise === product.franchise).slice(0,4)
  const fallback = products.filter(p => p.id !== product.id).slice(0,4)

  return (
    <div className="min-h-screen bg-graphite pb-24 md:pb-0">
      <div className="border-b border-white/6 bg-graphite">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-ink-muted">
          <button onClick={() => onNavigate('demo-home')} className="hover:text-ink transition-colors">Inicio demo</button>
          <span>/</span>
          <button onClick={() => onNavigate('catalog')} className="hover:text-ink transition-colors">Catálogo</button>
          <span>/</span>
          <span className="text-ink line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
          {/* Gallery */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square rounded-2xl bg-elevated overflow-hidden">
              <img src={product.images[selImg]} alt={`${product.name} — imagen ${selImg + 1}`} className="w-full h-full object-cover" />
              {isUnavailable && (
                <div className="absolute inset-0 bg-graphite/65 backdrop-blur-sm flex items-center justify-center">
                  <span className="bg-graphite/90 text-white/55 text-sm font-mono font-medium px-4 py-2 rounded-xl border border-white/10">Sin stock</span>
                </div>
              )}
              {isDeal && discount > 0 && (
                <div className="absolute top-4 right-4 bg-offer text-white font-bold text-sm px-3 py-1.5 rounded-xl font-mono">-{discount}%</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setSelImg(i)} aria-label={`Imagen ${i+1}`} aria-pressed={selImg === i}
                    className={cn('w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all', selImg === i ? 'border-brand' : 'border-white/8 hover:border-white/22')}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex flex-wrap gap-2 mb-2.5">
                <StockBadge status={product.stock} count={product.stockCount} />
                {product.condition !== 'Nuevo' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-700/15 text-amber-500 border-amber-700/25 font-mono">{product.condition}</span>
                )}
              </div>
              <p className="text-[10px] text-ink-muted font-mono uppercase tracking-widest mb-1">{product.franchise} · {product.brand}</p>
              <h1 className="text-xl md:text-2xl font-bold text-ink font-display leading-tight">{product.name}</h1>
            </div>

            <div className="flex items-end gap-4 pb-5 border-b border-white/8">
              <div>
                <p className="text-[10px] text-ink-muted font-mono uppercase tracking-widest mb-0.5">{priceLabel}</p>
                <p className={cn('text-3xl md:text-4xl font-black font-display', isDeal ? 'text-offer' : isPresale ? 'text-brand' : 'text-ink')}>{priceDisplay}</p>
                {isPresale && <p className="text-xs text-ink-muted mt-0.5">Precio total: <span className="text-ink font-medium">S/ {product.originalPrice?.toFixed(2)}</span></p>}
              </div>
              {product.originalPrice && !isPresale && (
                <div className="mb-1">
                  <p className="text-sm text-ink-muted line-through font-mono">S/ {product.originalPrice.toFixed(2)}</p>
                  <p className="text-xs text-offer font-medium font-mono">Ahorras S/ {(product.originalPrice - product.price).toFixed(2)}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[{l:'Marca',v:product.brand},{l:'Condición',v:product.condition},{l:'Escala',v:product.scale??'—'},{l:'Peso',v:product.weight}].map(({l,v}) => (
                <div key={l} className="bg-panel rounded-xl p-3 border border-white/6">
                  <p className="text-[9px] text-ink-muted font-mono uppercase tracking-widest">{l}</p>
                  <p className="text-sm font-medium text-ink mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {product.variants && product.variants.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-secondary mb-2">Variante</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button key={v} onClick={() => setSelVariant(v)} aria-pressed={selVariant === v}
                      className={cn('px-4 py-2 rounded-xl text-sm font-medium border transition-all', selVariant === v ? 'bg-brand/12 text-brand border-brand/35' : 'bg-panel text-ink-secondary border-white/8 hover:border-white/20 hover:text-ink')}
                    >{v}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Desktop CTA */}
            {!isUnavailable ? (
              <div className="hidden md:flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Stepper value={qty} onChange={setQty} max={product.stockCount || 10} />
                  {product.stock === 'last-units' && <span className="text-xs text-amber-400 font-mono">Solo quedan {product.stockCount}</span>}
                </div>
                <Btn variant={isDeal ? 'deal' : 'primary'} size="lg" fullWidth onClick={handleAdd} className={added ? '!bg-emerald-600 hover:!bg-emerald-600' : ''}>
                  {added ? <><IconCheck className="w-4 h-4" />Agregado al carrito</> : isPresale ? 'Reservar ahora' : <><IconCart className="w-4 h-4" />Agregar al carrito</>}
                </Btn>
              </div>
            ) : (
              <div className="hidden md:block bg-panel rounded-2xl p-4 border border-white/8">
                <p className="text-sm text-ink-secondary mb-3">Este producto está agotado actualmente.</p>
                <Btn variant="secondary" fullWidth>Avisarme cuando esté disponible</Btn>
              </div>
            )}

            {/* Shipping + Auth */}
            <div className="bg-panel rounded-2xl border border-white/8 divide-y divide-white/6">
              <div className="flex items-start gap-3 p-4">
                <IconTruck className="w-4 h-4 text-spark mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-ink">Envío a todo el Perú</p>
                  <p className="text-xs text-ink-muted mt-0.5">Olva Courier y Shalom. Entrega en 2–5 días hábiles.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <IconShield className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-ink">Autenticidad garantizada</p>
                  <p className="text-xs text-ink-muted mt-0.5">Producto 100% original con certificado verificable incluido.</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-secondary mb-2 uppercase tracking-widest font-mono">Descripción</p>
              <p className="text-sm text-ink-secondary leading-relaxed">{product.description}</p>
            </div>

            {isPresale && (
              <div className="bg-brand/7 border border-brand/20 rounded-2xl p-4">
                <p className="text-sm font-semibold text-brand mb-1.5">ℹ️ Información de preventa</p>
                <p className="text-xs text-ink-secondary leading-relaxed">Reservas el producto con un depósito de S/ 50.00. El saldo se paga antes del envío. Entrega estimada: <strong className="text-ink">{product.presaleDate}</strong>. El depósito es reembolsable si cancelas antes de que se procese.</p>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        <div className="mt-14 pt-10 border-t border-white/8">
          <h2 className="text-lg font-bold text-ink font-display mb-6">También te puede interesar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {(related.length > 0 ? related : fallback).map(p => <ProductCard key={p.id} product={p} onNavigate={onNavigate} onAddToCart={onAddToCart} />)}
          </div>
        </div>
      </div>

      {/* Fixed mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-graphite/97 backdrop-blur-md border-t border-white/8 px-4 py-3 safe-b">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-ink-muted font-mono">{priceLabel}</p>
            <p className={cn('text-xl font-black font-display truncate', isDeal ? 'text-offer' : isPresale ? 'text-brand' : 'text-ink')}>{priceDisplay}</p>
          </div>
          {isUnavailable ? (
            <Btn variant="secondary" size="lg" className="flex-shrink-0">Avísame</Btn>
          ) : (
            <>
              <Stepper value={qty} onChange={setQty} max={product.stockCount || 10} />
              <Btn variant={isDeal ? 'deal' : 'primary'} size="lg" onClick={handleAdd} className={cn('flex-shrink-0', added ? '!bg-emerald-600' : '')}>
                {added ? <IconCheck className="w-4 h-4" /> : <IconCart className="w-4 h-4" />}
                {added ? 'Listo' : isPresale ? 'Reservar' : 'Agregar'}
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Checkout View ─────────────────────────────────────────────────────────────

function CheckoutView({
  cart,
  onComplete,
  onNavigate,
}: {
  cart: CartItem[]
  onComplete: (submission: CheckoutSubmission) => Promise<void>
  onNavigate: (v: View) => void
}) {
  type Step = 'data' | 'delivery' | 'payment'
  const [step, setStep] = useState<Step>('data')
  const [form, setForm] = useState({ name:'',email:'',phone:'',dni:'', delivery:'shipping' as 'pickup'|'shipping', address:'',district:'', payment:'yape' as 'yape'|'plin'|'transfer' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [voucher, setVoucher] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const shipping = form.delivery === 'pickup' ? 0 : 12.00
  const total = subtotal + shipping

  const steps: {key:Step;label:string;n:number}[] = [{key:'data',label:'Tus datos',n:1},{key:'delivery',label:'Entrega',n:2},{key:'payment',label:'Pago',n:3}]
  const stepIdx = steps.findIndex(s => s.key === step)

  const validate = () => {
    const e: Record<string,string> = {}
    if (step === 'data') {
      if (!form.name.trim()) e.name = 'Nombre requerido'
      if (form.email && !form.email.includes('@')) e.email = 'Email inválido'
      if (form.phone.replace(/\D/g,'').length < 9) e.phone = 'Teléfono inválido (9 dígitos)'
    }
    if (step === 'delivery' && form.delivery === 'shipping') {
      if (!form.address.trim()) e.address = 'Dirección requerida'
      if (!form.district.trim()) e.district = 'Distrito requerido'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = async () => {
    if (!validate()) return
    if (step === 'data') setStep('delivery')
    else if (step === 'delivery') setStep('payment')
    else {
      setSubmitting(true)
      setSubmitError(null)
      try {
        await onComplete({ ...form, voucherUploaded: voucher })
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'No pudimos crear tu pedido. Inténtalo nuevamente.')
      } finally {
        setSubmitting(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-graphite">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => onNavigate('catalog')} className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded">
          <IconChevLeft /> Seguir comprando
        </button>

        <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
          <div>
            {/* Steps */}
            <div className="flex items-center gap-0 mb-8">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all',
                      i < stepIdx ? 'bg-brand text-white' : i === stepIdx ? 'bg-brand text-white ring-4 ring-brand/20' : 'bg-elevated text-ink-muted border border-white/10'
                    )}>
                      {i < stepIdx ? <IconCheck className="w-3.5 h-3.5" /> : s.n}
                    </div>
                    <span className={cn('text-sm font-medium hidden sm:block', i === stepIdx ? 'text-ink' : i < stepIdx ? 'text-ink-secondary' : 'text-ink-muted')}>{s.label}</span>
                  </div>
                  {i < steps.length-1 && <div className={cn('h-px w-8 md:w-10 mx-2 transition-all', i < stepIdx ? 'bg-brand' : 'bg-white/10')} />}
                </div>
              ))}
            </div>

            {step === 'data' && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-ink font-display">Tus datos de contacto</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2"><Input label="Nombre completo" placeholder="Rodrigo Mendoza Paredes" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} error={errors.name} required /></div>
                  <Input label="Correo electrónico" type="email" placeholder="rodrigo@email.com" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} error={errors.email} />
                  <Input label="Teléfono / Celular" type="tel" placeholder="987 654 321" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))} error={errors.phone} required hint="9 dígitos" />
                  <Input label="DNI o CE" placeholder="12345678" value={form.dni} onChange={v=>setForm(f=>({...f,dni:v}))} error={errors.dni} hint="Opcional: puede ser necesario para el recojo" />
                </div>
              </div>
            )}

            {step === 'delivery' && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-ink font-display">Método de entrega</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {value:'shipping',label:'Envío a domicilio',desc:'Olva o Shalom · S/ 12.00',icon:<IconTruck className="w-5 h-5"/>},
                    {value:'pickup',label:'Recojo en tienda',desc:'Lima, Miraflores · Gratis',icon:<span className="text-xl">🏪</span>},
                  ].map(opt => (
                    <button key={opt.value} onClick={()=>setForm(f=>({...f,delivery:opt.value as typeof form.delivery}))} aria-pressed={form.delivery===opt.value}
                      className={cn('flex items-start gap-3 p-4 rounded-2xl border text-left transition-all', form.delivery===opt.value ? 'bg-brand/10 border-brand/35' : 'bg-panel border-white/8 hover:border-white/18')}
                    >
                      <span className={cn('mt-0.5 flex-shrink-0', form.delivery===opt.value ? 'text-brand' : 'text-ink-muted')}>{opt.icon}</span>
                      <div className="flex-1">
                        <p className={cn('text-sm font-semibold', form.delivery===opt.value ? 'text-ink' : 'text-ink-secondary')}>{opt.label}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{opt.desc}</p>
                      </div>
                      <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all', form.delivery===opt.value ? 'border-brand bg-brand' : 'border-white/20')} />
                    </button>
                  ))}
                </div>
                {form.delivery === 'shipping' && (
                  <div className="flex flex-col gap-4">
                    <Input label="Dirección" placeholder="Av. Larco 456, dpto 3B" value={form.address} onChange={v=>setForm(f=>({...f,address:v}))} error={errors.address} required />
                    <Input label="Distrito" placeholder="Miraflores" value={form.district} onChange={v=>setForm(f=>({...f,district:v}))} error={errors.district} required />
                  </div>
                )}
                {form.delivery === 'pickup' && (
                  <div className="bg-panel rounded-2xl p-4 border border-white/8">
                    <p className="text-sm font-semibold text-ink mb-1">Punto de recojo</p>
                    <p className="text-xs text-ink-secondary">📍 Av. José Larco 101, Miraflores, Lima</p>
                    <p className="text-xs text-ink-muted mt-1">Lun–Sáb de 10 am a 7 pm · DNI requerido al recoger</p>
                  </div>
                )}
              </div>
            )}

            {step === 'payment' && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-ink font-display">Método de pago</h2>
                <div className="flex flex-col gap-2.5">
                  {[
                    {v:'yape',label:'Yape',desc:'987 654 321 · AnimeGeek Demo',icon:'💜'},
                    {v:'plin',label:'Plin',desc:'987 654 321 · AnimeGeek Demo',icon:'💚'},
                    {v:'transfer',label:'Transferencia bancaria',desc:'BCP · Cta. 193-12345678-0-28',icon:'🏦'},
                  ].map(opt => (
                    <button key={opt.v} onClick={()=>setForm(f=>({...f,payment:opt.v as typeof form.payment}))} aria-pressed={form.payment===opt.v}
                      className={cn('flex items-center gap-3 p-4 rounded-2xl border text-left transition-all', form.payment===opt.v ? 'bg-brand/10 border-brand/35' : 'bg-panel border-white/8 hover:border-white/18')}
                    >
                      <span className="text-xl flex-shrink-0">{opt.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink">{opt.label}</p>
                        <p className="text-xs text-ink-muted font-mono mt-0.5">{opt.desc}</p>
                      </div>
                      <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all', form.payment===opt.v ? 'border-brand bg-brand' : 'border-white/20')} />
                    </button>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-secondary mb-2">Comprobante de pago <span className="text-ink-muted">(opcional)</span></p>
                  <div
                    role="button" tabIndex={0} onClick={()=>setVoucher(true)} onKeyDown={e=>e.key==='Enter'&&setVoucher(true)}
                    className={cn('border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer', voucher ? 'border-emerald-500/35 bg-emerald-500/5' : 'border-white/10 hover:border-brand/30 hover:bg-brand/5')}
                    aria-label="Subir captura de pago"
                  >
                    {voucher ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center"><IconCheck className="w-5 h-5 text-emerald-400" /></div>
                        <p className="text-sm font-semibold text-emerald-400">Comprobante cargado</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-elevated border border-white/8 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-ink-muted"><path d="M4 14v2h12v-2M10 4v8M7 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <p className="text-sm text-ink-secondary">Puedes enviar la captura por WhatsApp</p>
                        <p className="text-xs text-ink-muted">El pedido se creará primero y tu stock quedará reservado.</p>
                      </div>
                    )}
                  </div>
                  {errors.voucher && <p className="text-xs text-offer mt-2">{errors.voucher}</p>}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              {stepIdx > 0 && <Btn variant="secondary" onClick={()=>setStep(steps[stepIdx-1].key)} className="flex-1 sm:flex-none">Anterior</Btn>}
              <Btn variant="primary" size="lg" className="flex-1" onClick={next} disabled={submitting}>
                {submitting ? 'Creando pedido…' : step==='payment' ? 'Confirmar pedido' : 'Continuar'} <IconChevRight />
              </Btn>
            </div>
            {submitError && <p role="alert" className="mt-3 text-sm text-offer">{submitError}</p>}
          </div>

          {/* Summary */}
          <div className="md:sticky md:top-24">
            <div className="bg-panel rounded-2xl border border-white/8 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8">
                <h3 className="text-sm font-bold text-ink font-display">Resumen del pedido</h3>
              </div>
              <div className="divide-y divide-white/6">
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-3 px-5 py-3">
                    <div className="w-12 h-12 rounded-xl bg-elevated overflow-hidden flex-shrink-0 border border-white/6">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink line-clamp-2 leading-snug">{item.product.name}</p>
                      <p className="text-[10px] text-ink-muted font-mono mt-0.5">×{item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-ink font-mono flex-shrink-0">S/ {(item.product.price*item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 flex flex-col gap-2">
                <div className="flex justify-between text-sm text-ink-secondary"><span>Subtotal</span><span className="font-mono">S/ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-ink-secondary"><span>Envío</span><span className={cn('font-mono', shipping===0?'text-emerald-400':'')}>{shipping===0?'Gratis':`S/ ${shipping.toFixed(2)}`}</span></div>
                <div className="flex justify-between text-base font-bold text-ink border-t border-white/8 pt-2 mt-1">
                  <span>Total</span><span className="font-display">S/ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Confirmation View ─────────────────────────────────────────────────────────

function AdminLoginView({ onAuthenticated, onNavigate, onPasswordRecovery }: { onAuthenticated: () => Promise<void>; onNavigate: (v: View) => void; onPasswordRecovery: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!supabase) {
      setError('El acceso se habilita al configurar Supabase para la plataforma.')
      return
    }

    setLoading(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('No pudimos iniciar sesión. Verifica tus credenciales.')
      setLoading(false)
      return
    }

    await onAuthenticated()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-graphite flex items-center justify-center px-4 py-12">
      <form onSubmit={signIn} className="w-full max-w-md bg-panel border border-white/8 rounded-2xl p-6 md:p-8">
        <img src="/brand/storeos-mark-dark.png" alt="StoreOS" className="mb-5 h-12 w-12 rounded-xl object-cover" />
        <h1 className="text-2xl font-black font-display text-ink">Accede a tu cuenta</h1>
        <p className="text-sm text-ink-secondary mt-2 leading-relaxed">Ingresa para administrar tus tiendas o terminar la creación de una nueva.</p>
        <div className="flex flex-col gap-4 mt-7">
          <Input label="Correo electrónico" type="email" value={email} onChange={setEmail} required />
          <Input label="Contraseña" type="password" value={password} onChange={setPassword} required />
        </div>
        {error && <p role="alert" className="text-sm text-offer mt-4">{error}</p>}
        <Btn type="submit" variant="primary" size="lg" fullWidth className="mt-6" disabled={loading}>
          {loading ? 'Validando acceso…' : 'Ingresar'}
        </Btn>
        <button type="button" onClick={onPasswordRecovery} className="w-full mt-3 text-sm text-brand hover:text-ink transition-colors">Olvidé mi contraseña</button>
        <button type="button" onClick={() => onNavigate('register')} className="w-full mt-3 text-sm text-brand hover:text-ink transition-colors">Crear una tienda nueva</button>
        <button type="button" onClick={() => onNavigate('saas-home')} className="w-full mt-3 text-sm text-ink-muted hover:text-ink transition-colors">Volver al inicio</button>
      </form>
    </div>
  )
}

function ConfirmationView({ order, onNavigate }: { order: Order | null; onNavigate: (v: View) => void }) {
  const code = order?.code ?? 'AKZ-2025-0043'
  const reserveExpiry = order?.reserveExpiryLabel ?? '16 ene 2025 a las 14:32'
  const paymentInstructions = order?.paymentInstructions ?? {
    label: 'Yape',
    recipient: 'AnimeGeek Demo',
    reference: '987 654 321',
    amount: 289.9,
  }
  const whatsappUrl = order?.whatsappUrl ?? `https://wa.me/51987654321?text=${encodeURIComponent(`Hola, mi pedido es ${code}`)}`
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1800) }

  return (
    <div className="min-h-screen bg-graphite flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-7">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <IconCheck className="w-9 h-9 text-emerald-400" />
            </div>
            <div className="absolute inset-0 rounded-full bg-emerald-500/8 animate-ping" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-ink font-display mb-2">¡Pedido confirmado!</h1>
          <p className="text-sm text-ink-secondary">
            {order ? `Enviamos el resumen a ${order.email}. También puedes confirmar el pago por WhatsApp.` : 'Revisa tu correo para los detalles. Te contactaremos por WhatsApp.'}
          </p>
        </div>

        <div className="bg-panel rounded-2xl border border-white/8 p-5 mb-4">
          <p className="text-[10px] text-ink-muted font-mono uppercase tracking-widest mb-2">Código de pedido</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-brand font-mono tracking-widest">{code}</span>
            <button onClick={copy} className="h-8 px-3 rounded-lg bg-elevated text-xs font-medium border border-white/8 hover:border-white/18 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Copiar código">
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="bg-amber-500/8 border border-amber-500/22 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <span className="text-amber-400 text-lg mt-0.5 flex-shrink-0">⏱</span>
          <div>
            <p className="text-sm font-semibold text-amber-400">Reserva activa hasta:</p>
            <p className="text-sm text-ink-secondary mt-0.5">{reserveExpiry}</p>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">Si no confirmamos el pago antes de esa hora, tu reserva se liberará automáticamente.</p>
          </div>
        </div>

        <div className="bg-panel rounded-2xl border border-white/8 p-4 mb-6">
          <p className="text-[10px] font-mono text-ink-muted uppercase tracking-widest mb-3">Instrucciones de pago · {paymentInstructions.label}</p>
          <div className="space-y-2 text-sm text-ink-secondary">
            <p>1. Realiza el pago a <strong className="text-ink">{paymentInstructions.reference}</strong></p>
            <p className="text-xs text-ink-muted">Titular o cuenta: {paymentInstructions.recipient}</p>
            <p>2. Monto exacto: <strong className="text-ink font-mono">S/ {paymentInstructions.amount.toFixed(2)}</strong></p>
            <p>3. Envía la captura por WhatsApp para confirmar.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="h-12 px-5 rounded-xl bg-[#25D366] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#20c05c] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
          >
            <IconWhatsapp className="w-5 h-5" />Confirmar por WhatsApp
          </a>
          <Btn variant="secondary" fullWidth onClick={()=>onNavigate('demo-home')}>Volver a la demo</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Orders ──────────────────────────────────────────────────────────────

function AdminOrdersView({ orders, onNavigate }: { orders: Order[]; onNavigate: (v: View) => void }) {
  type Tab = 'all'|'pending'|'confirmed'|'shipped'|'delivered'
  const [tab, setTab] = useState<Tab>('all')

  const tabs: {key:Tab;label:string}[] = [
    {key:'all',label:'Todos'},{key:'pending',label:'Pendientes'},{key:'confirmed',label:'Confirmados'},
    {key:'shipped',label:'Enviados'},{key:'delivered',label:'Entregados'},
  ]
  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab)
  const alerts = orders.filter(o => o.alertType)
  const revenue = orders.filter(o=>o.paymentStatus==='paid').reduce((s,o)=>s+o.total,0)

  const statusCfg: Record<Order['status'],{label:string;cls:string}> = {
    pending:   {label:'Pendiente',  cls:'bg-amber-500/15 text-amber-400 border-amber-500/22'},
    confirmed: {label:'Confirmado', cls:'bg-brand/15 text-brand-light border-brand/22'},
    shipped:   {label:'Enviado',    cls:'bg-spark/15 text-spark border-spark/22'},
    delivered: {label:'Entregado',  cls:'bg-emerald-500/15 text-emerald-400 border-emerald-500/22'},
    cancelled: {label:'Cancelado',  cls:'bg-white/5 text-white/35 border-white/10'},
  }
  const payCfg: Record<Order['paymentStatus'],{label:string;cls:string}> = {
    pending:  {label:'Sin pago',  cls:'bg-amber-500/10 text-amber-400'},
    paid:     {label:'Pagado',    cls:'bg-emerald-500/10 text-emerald-400'},
    rejected: {label:'Rechazado', cls:'bg-offer/10 text-offer'},
  }

  return (
    <div className="min-h-screen bg-graphite">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink font-display">Panel de Pedidos</h1>
            <p className="text-xs text-ink-muted font-mono mt-0.5">15 enero 2025</p>
          </div>
          <Btn variant="secondary" size="sm" onClick={()=>onNavigate('admin-product')}>+ Nuevo producto</Btn>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {l:'Pedidos hoy',v:String(orders.length),s:'total',c:'text-ink'},
            {l:'Pendientes de pago',v:String(orders.filter(o=>o.paymentStatus==='pending').length),s:'sin confirmar',c:'text-amber-400'},
            {l:'Por enviar',v:String(orders.filter(o=>o.status==='confirmed').length),s:'confirmados',c:'text-spark'},
            {l:'Ingresos del día',v:`S/ ${revenue.toFixed(2)}`,s:'cobrados',c:'text-emerald-400'},
          ].map(s => (
            <div key={s.l} className="bg-panel rounded-2xl p-4 border border-white/6">
              <p className="text-[9px] text-ink-muted font-mono uppercase tracking-widest">{s.l}</p>
              <p className={cn('text-xl font-black font-display mt-1', s.c)}>{s.v}</p>
              <p className="text-[10px] text-ink-muted mt-0.5">{s.s}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {alerts.map(o => (
              <div key={o.id} className={cn('flex items-center gap-3 p-4 rounded-2xl border', o.alertType==='payment-rejected' ? 'bg-offer/7 border-offer/18' : 'bg-amber-500/7 border-amber-500/18')}>
                <span className="text-xl flex-shrink-0">{o.alertType==='payment-rejected' ? '⚠️' : '⏰'}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', o.alertType==='payment-rejected' ? 'text-offer' : 'text-amber-400')}>
                    {o.alertType==='payment-rejected' ? 'Pago rechazado' : 'Reserva por vencer'}
                  </p>
                  <p className="text-xs text-ink-secondary mt-0.5 truncate">
                    {o.code} · {o.customer}{o.alertType==='expiring' && o.reserveExpiry ? ` · Vence ${o.reserveExpiry}` : ''}
                  </p>
                </div>
                <Btn variant="secondary" size="sm">Ver pedido</Btn>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-4 pb-1">
          {tabs.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
                tab===t.key ? 'bg-brand/12 text-brand border border-brand/28' : 'text-ink-secondary hover:text-ink hover:bg-elevated border border-transparent'
              )}
            >
              {t.label}
              <span className={cn('text-[10px] font-mono px-1.5 rounded-lg', tab===t.key ? 'bg-brand/18 text-brand' : 'bg-elevated text-ink-muted')}>
                {tab==='all' ? orders.length : orders.filter(o=>o.status===t.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Table desktop */}
        <div className="bg-panel rounded-2xl border border-white/6 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/6">
                  {['Código','Cliente','Items','Total','Pago','Estado','Acciones'].map(h => (
                    <th key={h} className="text-left text-[9px] font-semibold text-ink-muted uppercase tracking-widest font-mono px-4 py-3 first:rounded-tl-2xl last:rounded-tr-2xl">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {filtered.map(o => (
                  <tr key={o.id} className={cn('hover:bg-elevated/40 transition-colors', o.alertType && 'bg-amber-500/3')}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono font-semibold text-brand">{o.code}</p>
                      <p className="text-[10px] text-ink-muted font-mono mt-0.5">{o.date}</p>
                      {o.alertType && <p className="text-[10px] text-amber-400 font-mono mt-0.5">{o.alertType==='expiring'?'⏰ Vence pronto':'⚠️ Pago fallido'}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-ink font-medium">{o.customer}</p>
                      <p className="text-xs text-ink-muted">{o.email}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs font-mono text-ink-secondary">{o.itemCount} prod.</span></td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold font-display text-ink">S/ {o.total.toFixed(2)}</p>
                      <p className="text-[10px] text-ink-muted font-mono">{o.paymentMethod}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium font-mono', payCfg[o.paymentStatus].cls)}>{payCfg[o.paymentStatus].label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border font-mono', statusCfg[o.status].cls)}>{statusCfg[o.status].label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Btn variant="ghost" size="sm">Ver</Btn>
                        {o.status==='confirmed' && <Btn variant="secondary" size="sm">Enviar</Btn>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-white/6">
            {filtered.map(o => (
              <div key={o.id} className={cn('p-4 flex flex-col gap-3', o.alertType && 'bg-amber-500/3')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-mono font-semibold text-brand">{o.code}</p>
                    <p className="text-sm font-medium text-ink mt-0.5">{o.customer}</p>
                    <p className="text-[10px] text-ink-muted font-mono">{o.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold font-display text-ink">S/ {o.total.toFixed(2)}</p>
                    <span className={cn('mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border font-mono', statusCfg[o.status].cls)}>{statusCfg[o.status].label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium font-mono', payCfg[o.paymentStatus].cls)}>{payCfg[o.paymentStatus].label}</span>
                  <span className="text-xs text-ink-muted font-mono">{o.paymentMethod}</span>
                  {o.alertType && <span className="text-xs text-amber-400 font-mono">{o.alertType==='expiring'?'⏰ Vence pronto':'⚠️ Pago fallido'}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Product ─────────────────────────────────────────────────────────────

function AdminProductView({ tenant, backView, productId: editingProductId, onSaved, onNavigate }: { tenant: Pick<TenantSummary, 'name' | 'slug'>; backView: 'dashboard' | 'tenant-products' | 'admin-orders'; productId?: string; onSaved?: () => void; onNavigate: (v: View) => void }) {
  const [form, setForm] = useState({ name:'', franchise:'', category:'General', brand:'', price:'', originalPrice:'', scale:'', weight:'', condition:'Nuevo', stock:'available' as Product['stock'], description:'' })
  const [variants, setVariants] = useState<Array<{ id?: string; name: string; stock: number }>>([{name:'Estándar',stock:0}])
  const [newV, setNewV] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(Boolean(editingProductId))
  const [productStatus, setProductStatus] = useState<TenantProductStatus>('published')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const imagePreviewUrls = useMemo(() => imageFiles.map((file) => URL.createObjectURL(file)), [imageFiles])
  useEffect(() => () => imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url)), [imagePreviewUrls])
  const total = variants.reduce((s,v)=>s+v.stock,0)
  const discount = form.originalPrice && parseFloat(form.originalPrice) > parseFloat(form.price||'0') ? Math.round(((parseFloat(form.originalPrice)-parseFloat(form.price||'0'))/parseFloat(form.originalPrice))*100) : 0

  useEffect(() => {
    if (!editingProductId) return
    let isMounted = true
    getTenantProductDetail(tenant.slug, editingProductId)
      .then((product) => {
        if (!isMounted) return
        const firstVariant = product.variants[0]
        setForm((current) => ({
          ...current,
          name: product.name,
          category: product.categoryName ?? 'General',
          brand: product.brandName ?? '',
          price: firstVariant ? (firstVariant.salePriceCents / 100).toFixed(2) : '',
          originalPrice: firstVariant?.compareAtPriceCents ? (firstVariant.compareAtPriceCents / 100).toFixed(2) : '',
          condition: firstVariant?.conditionLabel ?? 'Nuevo',
          stock: firstVariant?.isPresale ? 'presale' : product.status === 'draft' ? 'out-of-stock' : 'available',
          description: product.description,
        }))
        setVariants(product.variants.map((variant) => ({ id: variant.id, name: variant.name, stock: variant.stock })))
        setProductStatus(product.status)
      })
      .catch((error) => { if (isMounted) setSaveError(error instanceof Error ? error.message : 'No se pudo cargar el producto.') })
      .finally(() => { if (isMounted) setLoadingProduct(false) })
    return () => { isMounted = false }
  }, [editingProductId, tenant.slug])

  const save = async () => {
    const price = Math.round(Number(form.price) * 100)
    const compareAtPrice = form.originalPrice ? Math.round(Number(form.originalPrice) * 100) : undefined
    if (!form.name.trim() || !Number.isFinite(price) || price < 0) {
      setSaveError('Ingresa un nombre y un precio válido.')
      return
    }
    if (variants.some((variant) => !variant.name.trim() || variant.stock < 0)) {
      setSaveError('Cada variante necesita nombre y stock válido.')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const draft = {
        name: form.name,
        categoryName: form.category,
        brandName: form.brand || undefined,
        description: form.description,
        isPublished: editingProductId ? productStatus === 'published' : form.stock !== 'out-of-stock',
        variants: variants.map((variant) => ({
          name: variant.name,
          stock: variant.stock,
          salePriceCents: price,
          compareAtPriceCents: compareAtPrice,
          conditionLabel: form.condition,
          isPresale: form.stock === 'presale',
        })),
      }
      if (editingProductId) {
        await updateTenantProduct(tenant.slug, editingProductId, { ...draft, status: productStatus }, variants.map((variant) => variant.id))
        await uploadTenantProductImages(tenant.slug, editingProductId, imageFiles)
      } else {
        await createTenantProduct(tenant.slug, draft, imageFiles)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onSaved?.()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No pudimos guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-graphite">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={()=>onNavigate(backView)} className="h-9 w-9 flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-elevated rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Volver">
            <IconChevLeft />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-ink font-display">{editingProductId ? 'Editar producto' : 'Nuevo producto'}</h1>
            <p className="text-xs text-ink-muted font-mono mt-0.5">Se guardará en {tenant.name}</p>
          </div>
          <Btn variant="secondary" size="sm">Vista previa</Btn>
          <Btn variant={saved?'secondary':'primary'} size="sm" onClick={save} disabled={saving || loadingProduct}>
            {loadingProduct ? 'Cargando…' : saving ? 'Guardando…' : saved ? <><IconCheck className="w-4 h-4" />Guardado</> : editingProductId ? 'Guardar cambios' : 'Crear producto'}
          </Btn>
        </div>

        <div className="grid md:grid-cols-[1fr_280px] gap-6">
          <div className="flex flex-col gap-5">
            {/* Images */}
            <div className="bg-panel rounded-2xl border border-white/6 p-5">
              <h2 className="text-sm font-bold text-ink font-display mb-4">Imágenes del producto</h2>
              <div className="grid grid-cols-4 gap-3">
                {imageFiles.map((file,i) => (
                  <div key={i} className="relative group aspect-square rounded-xl bg-elevated overflow-hidden border border-white/8">
                    <img src={imagePreviewUrls[i]} alt={`Imagen ${i+1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-graphite/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="text-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded" aria-label={`Eliminar imagen ${i+1}`}><IconClose className="w-4 h-4" /></button>
                    </div>
                    {i===0 && <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono bg-brand text-white px-1.5 py-0.5 rounded">Principal</span>}
                  </div>
                ))}
                <label className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-brand/30 hover:bg-brand/5 transition-all flex flex-col items-center justify-center gap-1 text-ink-muted hover:text-brand focus-within:outline-none focus-within:ring-2 focus-within:ring-brand cursor-pointer" aria-label="Agregar imagen">
                  <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))} />
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span className="text-[9px] font-mono">Agregar</span>
                </label>
              </div>
            </div>

            {/* Info */}
            <div className="bg-panel rounded-2xl border border-white/6 p-5 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-ink font-display">Información</h2>
              <Input label="Nombre del producto" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Categoría" value={form.category} onChange={v=>setForm(f=>({...f,category:v}))} required hint="Puedes crear una categoría nueva." />
                <Input label="Colección o etiqueta" value={form.franchise} onChange={v=>setForm(f=>({...f,franchise:v}))} hint="Opcional; puedes usar atributos personalizados para más detalle." />
                <Input label="Marca" value={form.brand} onChange={v=>setForm(f=>({...f,brand:v}))} />
                <Input label="Escala" placeholder="1/8" value={form.scale} onChange={v=>setForm(f=>({...f,scale:v}))} />
                <Input label="Peso" placeholder="320g" value={form.weight} onChange={v=>setForm(f=>({...f,weight:v}))} />
                <div>
                  <label className="text-sm font-medium text-ink-secondary block mb-1.5">Condición</label>
                  <select value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))} className="h-11 px-4 rounded-xl bg-elevated border border-white/8 text-sm text-ink w-full focus:outline-none focus:ring-2 focus:ring-brand">
                    {['Nuevo','Caja Dañada','Segunda Mano'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-secondary block mb-1.5">Descripción</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={4} className="w-full px-4 py-3 rounded-xl bg-elevated border border-white/8 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent" />
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-panel rounded-2xl border border-white/6 p-5 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-ink font-display">Precio</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Precio de venta (S/)" placeholder="289.90" value={form.price} onChange={v=>setForm(f=>({...f,price:v}))} required />
                <Input label="Precio original (tachado)" placeholder="Sin oferta" value={form.originalPrice} onChange={v=>setForm(f=>({...f,originalPrice:v}))} hint="Deja vacío si no hay oferta" />
              </div>
              {discount > 0 && (
                <div className="bg-offer/8 border border-offer/18 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-offer font-bold text-sm">-{discount}% de descuento</span>
                  <span className="text-xs text-ink-muted">· Se mostrará badge de oferta en rojo</span>
                </div>
              )}
            </div>

            {/* Variants */}
            <div className="bg-panel rounded-2xl border border-white/6 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink font-display">Variantes e inventario</h2>
                <span className="text-xs font-mono text-ink-muted bg-elevated border border-white/8 px-2 py-0.5 rounded-lg">Stock total: {total}</span>
              </div>
              <div className="flex flex-col gap-2">
                {variants.map((v,i) => (
                  <div key={i} className="flex items-center gap-3 bg-elevated rounded-xl p-3 border border-white/6">
                    <input value={v.name} onChange={e=>setVariants(vs=>vs.map((vv,ii)=>ii===i?{...vv,name:e.target.value}:vv))} className="flex-1 bg-transparent text-sm text-ink focus:outline-none placeholder:text-ink-muted/50" placeholder="Nombre de variante" aria-label={`Nombre variante ${i+1}`} />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-ink-muted font-mono">Stock:</label>
                      <input type="number" value={v.stock} min={0} onChange={e=>setVariants(vs=>vs.map((vv,ii)=>ii===i?{...vv,stock:parseInt(e.target.value)||0}:vv))} className="w-14 h-8 px-2 rounded-lg bg-panel border border-white/8 text-sm text-ink text-center font-mono focus:outline-none focus:ring-2 focus:ring-brand" aria-label={`Stock variante ${i+1}`} />
                    </div>
                    <button onClick={()=>setVariants(vs=>vs.filter((_,ii)=>ii!==i))} className="h-8 w-8 flex items-center justify-center text-ink-muted hover:text-offer hover:bg-offer/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label={`Eliminar variante ${v.name}`}>
                      <IconClose className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newV} onChange={e=>setNewV(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newV.trim()){setVariants(vs=>[...vs,{name:newV.trim(),stock:0}]);setNewV('')}}} placeholder="Nueva variante (ej: Base Especial)" className="flex-1 h-9 px-3 rounded-xl bg-elevated border border-white/8 text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-brand" aria-label="Nueva variante" />
                <Btn variant="secondary" size="sm" onClick={()=>{if(newV.trim()){setVariants(vs=>[...vs,{name:newV.trim(),stock:0}]);setNewV('')}}}>Agregar</Btn>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            <div className="bg-panel rounded-2xl border border-white/6 p-5 flex flex-col gap-4 md:sticky md:top-20">
              <h2 className="text-sm font-bold text-ink font-display">Publicación</h2>
              <div>
                <label className="text-xs font-medium text-ink-secondary block mb-1.5">Estado de stock</label>
                <select value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value as Product['stock']}))} className="h-11 px-4 rounded-xl bg-elevated border border-white/8 text-sm text-ink w-full focus:outline-none focus:ring-2 focus:ring-brand">
                  <option value="available">Disponible</option>
                  <option value="last-units">Últimas unidades</option>
                  <option value="out-of-stock">Agotado</option>
                  <option value="presale">Preventa</option>
                  <option value="deal">Oferta</option>
                  <option value="damaged-box">Caja dañada</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-muted font-mono">Preview:</span>
                <StockBadge status={form.stock} count={total} />
              </div>
              <div className="border-t border-white/8 pt-4 flex flex-col gap-2">
                <Btn variant="primary" fullWidth onClick={save}>{saved?<><IconCheck className="w-4 h-4"/>Guardado</>:'Publicar cambios'}</Btn>
                <Btn variant="destructive" fullWidth size="sm">Despublicar</Btn>
              </div>
              {saveError && <p role="alert" className="text-xs text-offer">{saveError}</p>}
              <div className="border-t border-white/8 pt-4">
                <p className="text-[9px] font-mono text-ink-muted uppercase tracking-widest mb-3">Estadísticas</p>
                {[{l:'Vistas',v:'1,247'},{l:'Vendidos',v:'38'},{l:'En carritos',v:'7'}].map(s => (
                  <div key={s.l} className="flex justify-between py-1">
                    <span className="text-xs text-ink-muted">{s.l}</span>
                    <span className="text-xs font-mono text-ink font-semibold">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── App Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>(() => readPublicStoreSlug() ? 'tenant-catalog' : 'saas-home')
  const [productId, setProductId] = useState('1')
  const [products, setProducts] = useState<Product[]>(() => readPublicStoreSlug() ? [] : DEMO_PRODUCTS)
  const [catalogTenantSlug, setCatalogTenantSlug] = useState<string | undefined>(() => readPublicStoreSlug() ?? tenantSlug)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>(ORDERS)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [hasAdminAccess, setHasAdminAccess] = useState(false)
  const [myTenants, setMyTenants] = useState<TenantSummary[]>([])
  const [activeTenant, setActiveTenant] = useState<TenantSummary | null>(null)
  const [tenantProductCount, setTenantProductCount] = useState<number | null>(null)
  const [editingTenantProductId, setEditingTenantProductId] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !catalogTenantSlug) return

    let isMounted = true
    getPublishedProducts(catalogTenantSlug)
      .then((publishedProducts) => {
        if (isMounted) {
          setProducts(publishedProducts)
          if (publishedProducts[0]) setProductId(publishedProducts[0].id)
        }
      })
      .catch(() => {
        if (isMounted) setProducts([])
        if (isMounted) setToast('No se pudo actualizar el catálogo. Inténtalo nuevamente en unos minutos.')
      })

    return () => { isMounted = false }
  }, [catalogTenantSlug])

  useEffect(() => {
    if (!activeTenant) {
      setTenantProductCount(null)
      return
    }
    let isMounted = true
    getTenantProducts(activeTenant.slug)
      .then((items) => { if (isMounted) setTenantProductCount(items.filter((item) => item.status !== 'archived').length) })
      .catch(() => { if (isMounted) setTenantProductCount(null) })
    return () => { isMounted = false }
  }, [activeTenant?.id])

  const refreshWorkspace = async (): Promise<TenantSummary[]> => {
    if (!supabase) {
      setHasAdminAccess(false)
      setMyTenants([])
      setActiveTenant(null)
      return []
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setHasAdminAccess(false)
      setMyTenants([])
      setActiveTenant(null)
      return []
    }

    const tenants = await getMyTenants()
    setMyTenants(tenants)
    setActiveTenant((current) => current && tenants.some((tenant) => tenant.id === current.id) ? current : (tenants[0] ?? null))
    const allowed = isStorefrontConfigured ? await hasActiveTenantStaffAccess(user.id) : false
    setHasAdminAccess(allowed)
    return tenants
  }

  useEffect(() => {
    if (!supabase) return
    void refreshWorkspace()
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      void refreshWorkspace()
      if (event === 'PASSWORD_RECOVERY') setView('password-reset-confirm')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const navigate = (v: View, id?: string) => {
    if ((v === 'admin-orders' || v === 'admin-product') && !hasAdminAccess) {
      setView('admin-login')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if ((v === 'dashboard' || v === 'tenant-products' || v === 'tenant-product' || v === 'tenant-product-edit') && !activeTenant) {
      setView('onboarding')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if ((v === 'demo-home' || v === 'catalog') && tenantSlug && catalogTenantSlug !== tenantSlug) {
      setCatalogTenantSlug(tenantSlug)
      setProducts(DEMO_PRODUCTS)
      setCart([])
    }
    if (id) setProductId(id)
    setView(v)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addToCart = (product: Product, quantity = 1) => {
    if (catalogTenantSlug !== tenantSlug) {
      setToast('Esta tienda aún no tiene checkout habilitado. Estamos mostrando su catálogo publicado.')
      setTimeout(() => setToast(null), 3600)
      return
    }
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id)
      const maxQuantity = product.stock === 'presale' ? 10 : product.stockCount
      const nextQuantity = Math.min((ex?.quantity ?? 0) + quantity, maxQuantity)
      if (nextQuantity <= 0) return prev
      if (ex) return prev.map(i => i.product.id === product.id ? { ...i, quantity: nextQuantity } : i)
      return [...prev, { product, quantity: nextQuantity }]
    })
    const name = product.name.split('—')[0].trim()
    setToast(`${name.length > 32 ? name.slice(0,32)+'…' : name} agregado`)
    setTimeout(() => setToast(null), 2800)
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const handleCheckoutComplete = async (submission: CheckoutSubmission) => {
    if (cart.length === 0) throw new Error('Tu carrito está vacío.')

    const createdOrder = isSupabaseConfigured && catalogTenantSlug
      ? await createLiveOrder(catalogTenantSlug, submission, cart)
      : createMockOrder({
          cart: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            unitPrice: item.product.price,
            quantity: item.quantity,
          })),
          checkout: submission,
          currentOrdersCount: orders.length,
        })

    setOrders(prev => [createdOrder, ...prev])
    setLastOrder(createdOrder)
    setCart([])
    navigate('confirmation')
  }

  return (
    <div className="min-h-screen bg-graphite text-ink">
      <Navbar view={view} cartCount={cartCount} hasAdminAccess={hasAdminAccess} hasWorkspace={myTenants.length > 0} onNavigate={navigate} onCartOpen={() => setCartOpen(true)} />

      <main>
        {view === 'saas-home'     && <SaasHomeView onNavigate={navigate} />}
        {view === 'demo-home'     && <HomeView products={products} onNavigate={navigate} onAddToCart={addToCart} />}
        {view === 'catalog'       && <CatalogView products={products} onNavigate={navigate} onAddToCart={addToCart} />}
        {view === 'tenant-catalog' && <CatalogView products={products} onNavigate={navigate} onAddToCart={addToCart} storeSlug={catalogTenantSlug} />}
        {view === 'product'       && <ProductView products={products} productId={productId} onNavigate={navigate} onAddToCart={addToCart} />}
        {view === 'checkout'      && <CheckoutView cart={cart} onComplete={handleCheckoutComplete} onNavigate={navigate} />}
        {view === 'register'      && <RegisterView onSignedIn={async () => { const tenants = await refreshWorkspace(); navigate(tenants.length > 0 ? 'dashboard' : 'onboarding') }} onLogin={() => navigate('admin-login')} />}
        {view === 'password-reset-request' && <PasswordRecoveryRequestView onLogin={() => navigate('admin-login')} />}
        {view === 'password-reset-confirm' && <PasswordRecoveryConfirmView onLogin={() => { void supabase?.auth.signOut(); navigate('admin-login') }} />}
        {view === 'onboarding'    && <StoreSetupView onCreated={(tenant) => { setMyTenants((tenants) => [tenant, ...tenants]); setActiveTenant(tenant); navigate('dashboard') }} onSignOut={async () => { await supabase?.auth.signOut(); await refreshWorkspace(); navigate('saas-home') }} />}
        {view === 'dashboard' && activeTenant && <TenantDashboardView tenant={activeTenant} productCount={tenantProductCount} onCreateStore={() => navigate('onboarding')} onManageProducts={() => navigate('tenant-products')} onCreateProduct={() => navigate('tenant-product')} onViewStore={() => { setCatalogTenantSlug(activeTenant.slug); setProducts([]); setCart([]); navigate('tenant-catalog') }} onSignOut={async () => { await supabase?.auth.signOut(); await refreshWorkspace(); navigate('saas-home') }} />}
        {view === 'tenant-products' && activeTenant && <TenantProductsView tenant={activeTenant} onBack={() => navigate('dashboard')} onCreateProduct={() => navigate('tenant-product')} onEditProduct={(productId) => { setEditingTenantProductId(productId); navigate('tenant-product-edit') }} onProductCountChange={setTenantProductCount} />}
        {view === 'admin-login'   && <AdminLoginView onAuthenticated={async () => { const tenants = await refreshWorkspace(); setView(tenants.length > 0 ? 'dashboard' : 'onboarding') }} onNavigate={navigate} onPasswordRecovery={() => navigate('password-reset-request')} />}
        {view === 'confirmation'  && <ConfirmationView order={lastOrder} onNavigate={navigate} />}
        {view === 'admin-orders'  && <AdminOrdersView orders={orders} onNavigate={navigate} />}
        {view === 'tenant-product' && activeTenant && <AdminProductView tenant={activeTenant} backView="dashboard" onSaved={() => navigate('tenant-products')} onNavigate={navigate} />}
        {view === 'tenant-product-edit' && activeTenant && editingTenantProductId && <AdminProductView tenant={activeTenant} productId={editingTenantProductId} backView="tenant-products" onSaved={() => navigate('tenant-products')} onNavigate={navigate} />}
        {view === 'admin-product' && <AdminProductView tenant={{ name: 'AnimeGeek', slug: tenantSlug ?? 'animegeek' }} backView="admin-orders" onNavigate={navigate} />}
      </main>

      {cartOpen && (
        <CartSidebar
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={(id, qty) => setCart(p => p.map(i => i.product.id === id ? { ...i, quantity: qty } : i))}
          onRemove={id => setCart(p => p.filter(i => i.product.id !== id))}
          onCheckout={() => { setCartOpen(false); navigate('checkout') }}
        />
      )}

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-elevated border border-white/12 text-ink text-sm font-medium px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 max-w-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
          <span className="truncate">{toast}</span>
          <IconCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        </div>
      )}

      {!['demo-home', 'catalog', 'tenant-catalog', 'product', 'checkout', 'confirmation', 'admin-orders', 'admin-product'].includes(view) && <SupportChat />}
    </div>
  )
}
