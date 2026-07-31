import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartLine } from '@/types/catalog'

interface CartState {
  lines: CartLine[]
  wishlist: string[]
  isCartOpen: boolean
  addToCart: (productId: string, quantity?: number) => void
  removeFromCart: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleWishlist: (productId: string) => void
  openCart: () => void
  closeCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      wishlist: [],
      isCartOpen: false,
      addToCart: (productId, quantity = 1) => {
        const existing = get().lines.find((l) => l.productId === productId)
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l,
            ),
          })
        } else {
          set({ lines: [...get().lines, { productId, quantity }] })
        }
        set({ isCartOpen: true })
      },
      removeFromCart: (productId) => set({ lines: get().lines.filter((l) => l.productId !== productId) }),
      setQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId)
          return
        }
        set({ lines: get().lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)) })
      },
      clearCart: () => set({ lines: [] }),
      toggleWishlist: (productId) => {
        const inList = get().wishlist.includes(productId)
        set({
          wishlist: inList ? get().wishlist.filter((id) => id !== productId) : [...get().wishlist, productId],
        })
      },
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
    }),
    { name: 'pramukhraj-cart' },
  ),
)
