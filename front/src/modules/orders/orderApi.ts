import { supabase } from '@/lib/supabase'

export type PaymentMethod = 'yape' | 'plin' | 'transfer'
export type DeliveryMethod = 'pickup' | 'shipping'

export interface CreateOrderInput {
  idempotencyKey: string
  customer: {
    name: string
    email?: string
    phone: string
    documentNumber?: string
  }
  delivery: {
    method: DeliveryMethod
    address?: string
    district?: string
  }
  payment: { method: PaymentMethod }
  items: Array<{ variantId: string; quantity: number }>
}

export interface CreatedOrder {
  orderId: string
  orderNumber: string
  status: 'pending_payment'
  paymentStatus: 'pending'
  totalCents: number
  reserveExpiresAt: string
  whatsappNumber: string
  whatsappMessage: string
}

export async function createOrder(tenantSlug: string, input: CreateOrderInput): Promise<CreatedOrder> {
  if (!supabase || !tenantSlug) throw new Error('Supabase no está configurado.')

  const { data, error } = await supabase.functions.invoke('create-order', {
    body: {
      tenantSlug,
      idempotencyKey: input.idempotencyKey,
      customer: {
      name: input.customer.name,
      email: input.customer.email ?? '',
      phone: input.customer.phone,
      documentNumber: input.customer.documentNumber ?? '',
      },
      delivery: input.delivery,
      payment: input.payment,
      items: input.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
    },
  })

  if (error) throw error
  return data as CreatedOrder
}
