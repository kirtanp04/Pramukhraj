import { products } from './generateProducts'

export interface Order {
  id: string
  date: string
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Cancelled'
  total: number
  items: { productId: string; quantity: number }[]
  trackingId: string
  courier: string
  expectedDelivery: string
}

const statuses: Order['status'][] = ['Delivered', 'Shipped', 'Processing', 'Delivered', 'Delivered', 'Cancelled']

export const orders: Order[] = Array.from({ length: 6 }).map((_, i) => {
  const items = products.slice(i * 3, i * 3 + 2).map((p) => ({ productId: p.id, quantity: 1 + (i % 2) }))
  const total = items.reduce((sum, it) => {
    const p = products.find((pp) => pp.id === it.productId)!
    return sum + p.price * it.quantity
  }, 0)
  return {
    id: `PRJ${100234 + i}`,
    date: new Date(2026, 6 - i, 12 + i).toISOString(),
    status: statuses[i],
    total,
    items,
    trackingId: `TRK${9000000 + i * 137}`,
    courier: ['BlueDart', 'Delhivery', 'Ekart', 'DTDC'][i % 4],
    expectedDelivery: new Date(2026, 6 - i, 16 + i).toDateString(),
  }
})
