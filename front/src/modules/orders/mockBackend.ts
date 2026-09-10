export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'rejected'
export type PaymentMethod = 'yape' | 'plin' | 'transfer'
export type DeliveryMethod = 'pickup' | 'shipping'

export interface CheckoutSubmission {
  name: string
  email: string
  phone: string
  dni: string
  delivery: DeliveryMethod
  address: string
  district: string
  payment: PaymentMethod
  voucherUploaded: boolean
}

export interface CheckoutLineInput {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
}

export interface PaymentInstructions {
  label: string
  recipient: string
  reference: string
  amount: number
}

export interface OrderRecord {
  id: string
  code: string
  customer: string
  customerPhone?: string
  email: string
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  date: string
  itemCount: number
  reserveExpiry?: string
  reserveExpiryLabel?: string
  alertType?: 'expiring' | 'payment-rejected'
  whatsappUrl?: string
  paymentInstructions?: PaymentInstructions
}

const SHIPPING_FLAT_RATE = 12
const RESERVE_WINDOW_MINUTES = 30
const WHATSAPP_NUMBER = '51987654321'

const PAYMENT_METHODS: Record<PaymentMethod, Omit<PaymentInstructions, 'amount'>> = {
  yape: {
    label: 'Yape',
    recipient: 'AnimeGeek Demo',
    reference: '987 654 321',
  },
  plin: {
    label: 'Plin',
    recipient: 'AnimeGeek Demo',
    reference: '987 654 321',
  },
  transfer: {
    label: 'Transferencia bancaria',
    recipient: 'BCP',
    reference: 'Cta. 193-12345678-0-28',
  },
}

export function getSeedOrders(): OrderRecord[] {
  return [
    {
      id: 'ORD-001',
      code: 'AKZ-2025-0042',
      customer: 'Rodrigo Mendoza',
      email: 'rodrigo@email.com',
      total: 638.9,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'Yape',
      date: '15 ene · 14:32',
      itemCount: 3,
      reserveExpiry: '16 ene · 14:32',
      reserveExpiryLabel: '16 ene 2025 a las 14:32',
      alertType: 'expiring',
      whatsappUrl: 'https://wa.me/51987654321?text=Hola%2C%20quiero%20confirmar%20el%20pedido%20AKZ-2025-0042',
      paymentInstructions: { label: 'Yape', recipient: 'AnimeGeek Demo', reference: '987 654 321', amount: 638.9 },
    },
    {
      id: 'ORD-002',
      code: 'AKZ-2025-0041',
      customer: 'Valeria Quispe',
      email: 'vale@email.com',
      total: 289.9,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'Transferencia',
      date: '15 ene · 11:20',
      itemCount: 1,
    },
    {
      id: 'ORD-003',
      code: 'AKZ-2025-0040',
      customer: 'Sebastián Torres',
      email: 'storres@email.com',
      total: 459,
      status: 'shipped',
      paymentStatus: 'paid',
      paymentMethod: 'Plin',
      date: '14 ene · 09:15',
      itemCount: 2,
    },
    {
      id: 'ORD-004',
      code: 'AKZ-2025-0039',
      customer: 'Camila Flores',
      email: 'camila@email.com',
      total: 349,
      status: 'pending',
      paymentStatus: 'rejected',
      paymentMethod: 'Yape',
      date: '13 ene · 16:45',
      itemCount: 1,
      alertType: 'payment-rejected',
    },
    {
      id: 'ORD-005',
      code: 'AKZ-2025-0038',
      customer: 'Diego Palomino',
      email: 'dpalomino@email.com',
      total: 198,
      status: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'Transferencia',
      date: '12 ene · 13:00',
      itemCount: 1,
    },
  ]
}

export function createMockOrder(input: {
  cart: CheckoutLineInput[]
  checkout: CheckoutSubmission
  currentOrdersCount: number
  now?: Date
}): OrderRecord {
  const now = input.now ?? new Date()
  const reserveExpiryDate = new Date(now.getTime() + RESERVE_WINDOW_MINUTES * 60 * 1000)
  const subtotal = input.cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  const shipping = input.checkout.delivery === 'pickup' ? 0 : SHIPPING_FLAT_RATE
  const total = roundCurrency(subtotal + shipping)
  const nextSequence = Math.max(input.currentOrdersCount + 38, 43)
  const code = formatOrderCode(now, nextSequence)
  const paymentMeta = PAYMENT_METHODS[input.checkout.payment]
  const whatsappMessage = [
    `Hola, quiero confirmar el pedido ${code}.`,
    `Cliente: ${input.checkout.name}.`,
    `Monto enviado: S/ ${total.toFixed(2)}.`,
    `Método de pago: ${paymentMeta.label}.`,
  ].join(' ')

  return {
    id: `ORD-${String(input.currentOrdersCount + 1).padStart(3, '0')}`,
    code,
    customer: input.checkout.name.trim(),
    customerPhone: normalizePhone(input.checkout.phone),
    email: input.checkout.email.trim(),
    total,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: paymentMeta.label,
    date: formatCompactDate(now),
    itemCount: input.cart.reduce((sum, line) => sum + line.quantity, 0),
    reserveExpiry: formatCompactDate(reserveExpiryDate),
    reserveExpiryLabel: formatLongDateTime(reserveExpiryDate),
    alertType: 'expiring',
    whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`,
    paymentInstructions: {
      ...paymentMeta,
      amount: total,
    },
  }
}

function formatOrderCode(date: Date, sequence: number) {
  return `AKZ-${date.getFullYear()}-${String(sequence).padStart(4, '0')}`
}

function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function formatCompactDate(date: Date) {
  const day = new Intl.DateTimeFormat('es-PE', { day: '2-digit', timeZone: 'America/Lima' }).format(date)
  const month = new Intl.DateTimeFormat('es-PE', { month: 'short', timeZone: 'America/Lima' }).format(date).replace('.', '')
  const time = new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Lima',
  }).format(date)

  return `${day} ${month} · ${time}`
}

function formatLongDateTime(date: Date) {
  const day = new Intl.DateTimeFormat('es-PE', { day: '2-digit', timeZone: 'America/Lima' }).format(date)
  const month = new Intl.DateTimeFormat('es-PE', { month: 'short', timeZone: 'America/Lima' }).format(date).replace('.', '')
  const year = new Intl.DateTimeFormat('es-PE', { year: 'numeric', timeZone: 'America/Lima' }).format(date)
  const time = new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Lima',
  }).format(date)

  return `${day} ${month} ${year} a las ${time}`
}
