import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useCartStore } from '@/store/cartStore'
import { products } from '@/mock'
import { formatINR } from '@/lib/utils'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { Button } from '@/components/ui/Button'

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isCartOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const lines = useCartStore((s) => s.lines)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeFromCart = useCartStore((s) => s.removeFromCart)

  const items = useMemo(
    () =>
      lines
        .map((l) => ({ product: products.find((p) => p.id === l.productId), quantity: l.quantity }))
        .filter((i): i is { product: (typeof products)[number]; quantity: number } => !!i.product),
    [lines],
  )
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-ink/40"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col bg-ivory shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                  <Dialog.Title className="flex items-center gap-2 font-display text-lg">
                    <ShoppingBag size={18} /> Your Cart ({items.length})
                  </Dialog.Title>
                  <Dialog.Close aria-label="Close cart"><X size={20} /></Dialog.Close>
                </div>

                {items.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                    <div className="scallop-bottom scallop-top h-16 w-16 rounded-full bg-tan" />
                    <p className="font-display text-lg">Your cart is empty</p>
                    <p className="text-sm text-ink-soft">Add some traditional favourites to get started.</p>
                    <Button onClick={closeCart} asChild>
                      <Link to="/products">Browse Products</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
                      {items.map(({ product, quantity }) => (
                        <div key={product.id} className="flex gap-3 py-4">
                          <img src={product.thumbnail} alt={product.name} className="h-20 w-20 rounded-lg object-cover" />
                          <div className="flex flex-1 flex-col">
                            <div className="flex justify-between gap-2">
                              <Link to={`/product/${product.slug}`} onClick={closeCart} className="line-clamp-2 text-sm font-medium hover:text-oxblood">
                                {product.name}
                              </Link>
                              <button aria-label="Remove item" onClick={() => removeFromCart(product.id)} className="shrink-0 text-ink-soft hover:text-oxblood">
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <span className="text-xs text-ink-soft">{product.weight}</span>
                            <div className="mt-auto flex items-center justify-between">
                              <QuantityStepper value={quantity} onChange={(v) => setQuantity(product.id, v)} />
                              <span className="font-mono text-sm font-semibold">{formatINR(product.price * quantity)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-ink/10 px-5 py-4">
                      <div className="mb-3 flex items-center justify-between text-sm text-ink-soft">
                        <span>Subtotal</span>
                        <span className="font-mono text-base font-semibold text-ink">{formatINR(subtotal)}</span>
                      </div>
                      <p className="mb-3 text-xs text-ink-soft">Taxes and shipping calculated at checkout.</p>
                      <Button className="w-full" size="lg" onClick={closeCart} asChild>
                        <Link to="/checkout">Checkout</Link>
                      </Button>
                      <Button variant="ghost" className="mt-2 w-full" onClick={closeCart} asChild>
                        <Link to="/cart">View Full Cart</Link>
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
