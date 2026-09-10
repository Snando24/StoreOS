export type ProductStock = 'available' | 'last-units' | 'out-of-stock' | 'presale' | 'deal' | 'damaged-box'

export interface Product {
  id: string
  variantId: string
  name: string
  franchise: string
  category: string
  price: number
  originalPrice?: number
  stock: ProductStock
  stockCount: number
  condition: string
  images: string[]
  description: string
  variants?: string[]
  presaleDate?: string
  brand: string
  scale?: string
  weight: string
}
