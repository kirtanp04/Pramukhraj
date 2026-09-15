import { guestCartSchema } from '../schemas/cart.schema'
import type { GuestCart, GuestCartItem } from '../types/cart.types'

export const GUEST_CART_STORAGE_KEY = 'pramukhraj-guest-cart-v1'
const MAX_ITEMS = 50
const MAX_QUANTITY = 20

function emptyCart(): GuestCart { return { version: 1, items: [], updatedAt: new Date().toISOString() } }

function sanitize(items: unknown): GuestCartItem[] {
  if (!Array.isArray(items)) return []
  const quantities = new Map<string, number>()
  for (const value of items.slice(0, MAX_ITEMS * 2)) {
    const parsed = guestCartSchema.shape.items.element.safeParse(value)
    if (!parsed.success) continue
    const id = parsed.data.productVariantId.toLowerCase()
    quantities.set(id, Math.min(MAX_QUANTITY, (quantities.get(id) ?? 0) + parsed.data.quantity))
    if (quantities.size >= MAX_ITEMS) break
  }
  return [...quantities].map(([productVariantId, quantity]) => ({ productVariantId, quantity }))
}

function write(items: GuestCartItem[]): GuestCart {
  const cart: GuestCart = { version: 1, items: sanitize(items), updatedAt: new Date().toISOString() }
  localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cart))
  return cart
}

export const guestCartService = {
  read(): GuestCart {
    try {
      const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY)
      if (!raw) return emptyCart()
      const value: unknown = JSON.parse(raw)
      const parsed = guestCartSchema.safeParse(value)
      const cart = write(parsed.success ? parsed.data.items : sanitize((value as { items?: unknown } | null)?.items))
      return cart
    } catch { localStorage.removeItem(GUEST_CART_STORAGE_KEY); return emptyCart() }
  },
  add(productVariantId: string, quantity = 1) {
    const current = this.read().items
    return write([...current, { productVariantId, quantity }])
  },
  update(productVariantId: string, quantity: number) {
    return write(this.read().items.map(item => item.productVariantId === productVariantId
      ? { ...item, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) } : item))
  },
  remove(productVariantId: string) { return write(this.read().items.filter(item => item.productVariantId !== productVariantId)) },
  clear() { localStorage.removeItem(GUEST_CART_STORAGE_KEY) },
}
