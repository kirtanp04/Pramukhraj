import { useMemo } from 'react'
import type { CartItem } from '../types/cart.types'

export function useCartImages(items: CartItem[]) {
  return useMemo(() => Object.fromEntries(items.map(item => [item.productId, item.imageUrl])), [items])
}
