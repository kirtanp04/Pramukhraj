import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Tag, ShoppingBag, Heart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { products } from '@/mock'
import { formatINR } from '@/lib/utils'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { Button } from '@/components/ui/Button'
import { ProductRail } from '@/components/storefront/ProductRail'

export function Cart() {
  const lines = useCartStore((s) => s.lines)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeFromCart = useCartStore((s) => s.removeFromCart)
  const toggleWishlist = useCartStore((s) => s.toggleWishlist)
  const [coupon, setCoupon] = useState('')
  const [applied, setApplied] = useState<string | null>(null)

  const items = useMemo(
    () => lines.map((l) => ({ product: products.find((p) => p.id === l.productId), quantity: l.quantity }))
      .filter((i): i is { product: (typeof products)[number]; quantity: number } => !!i.product),
    [lines],
  )
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const discount = applied === 'WELCOME10' ? Math.round(subtotal * 0.1) : 0
  const shipping = subtotal > 499 || subtotal === 0 ? 0 : 49
  const tax = Math.round((subtotal - discount) * 0.05)
  const total = subtotal - discount + shipping + tax

  const recommendations = products.filter((p) => !lines.some((l) => l.productId === p.id)).slice(0, 4)

  function applyCoupon() {
    if (coupon.trim().toUpperCase() === 'WELCOME10') setApplied('WELCOME10')
    else setApplied(null)
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center">
        <div className="scallop-bottom scallop-top mb-5 h-20 w-20 rounded-full bg-tan" />
        <h1 className="font-display text-2xl">Your cart is empty</h1>
        <p className="mt-2 text-sm text-ink-soft">Looks like you haven't added anything yet.</p>
        <Button className="mt-6" asChild><Link to="/products">Browse Products</Link></Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="font-display text-3xl">Shopping Cart</h1>
      <p className="mt-1 text-sm text-ink-soft">{items.length} item{items.length > 1 ? 's' : ''} in your cart</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 rounded-card border border-ink/10 p-4">
              <Link to={`/product/${product.slug}`}>
                <img src={product.thumbnail} alt={product.name} className="h-24 w-24 rounded-lg object-cover sm:h-28 sm:w-28" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs uppercase text-ink-soft">{product.brand.name}</span>
                    <Link to={`/product/${product.slug}`} className="block font-display text-base hover:text-oxblood sm:text-lg">
                      {product.name}
                    </Link>
                    <span className="text-xs text-ink-soft">{product.weight}</span>
                  </div>
                  <span className="font-mono text-base font-semibold text-oxblood">{formatINR(product.price * quantity)}</span>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <QuantityStepper value={quantity} onChange={(v) => setQuantity(product.id, v)} max={product.stock} />
                  <div className="flex items-center gap-4 text-xs">
                    <button onClick={() => { toggleWishlist(product.id); removeFromCart(product.id) }} className="flex items-center gap-1 text-ink-soft hover:text-oxblood">
                      <Heart size={13} /> Save for later
                    </button>
                    <button onClick={() => removeFromCart(product.id)} className="flex items-center gap-1 text-ink-soft hover:text-oxblood">
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-card border border-ink/10 bg-ivory-dim p-5">
          <h2 className="font-display text-lg">Order Summary</h2>

          <div className="mt-4 flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-full border border-ink/15 bg-ivory px-3">
              <Tag size={14} className="text-ink-soft" />
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Coupon code (try WELCOME10)"
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-ink-soft/60"
              />
            </div>
            <Button variant="outline" onClick={applyCoupon}>Apply</Button>
          </div>
          {applied && <p className="mt-2 text-xs text-green-700">WELCOME10 applied — 10% off</p>}

          <div className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between text-ink-soft"><span>Subtotal</span><span className="font-mono text-ink">{formatINR(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span className="font-mono">-{formatINR(discount)}</span></div>}
            <div className="flex justify-between text-ink-soft"><span>Shipping</span><span className="font-mono text-ink">{shipping === 0 ? 'Free' : formatINR(shipping)}</span></div>
            <div className="flex justify-between text-ink-soft"><span>Estimated Tax</span><span className="font-mono text-ink">{formatINR(tax)}</span></div>
          </div>
          <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 font-semibold">
            <span>Total</span><span className="font-mono text-lg text-oxblood">{formatINR(total)}</span>
          </div>

          <Button size="lg" className="mt-5 w-full" asChild>
            <Link to="/checkout"><ShoppingBag size={16} /> Proceed to Checkout</Link>
          </Button>
          <Link to="/products" className="mt-3 block text-center text-sm text-ink-soft hover:text-ink">Continue Shopping</Link>
        </aside>
      </div>

      {recommendations.length > 0 && <ProductRail title="You Might Also Like" products={recommendations} />}
    </div>
  )
}
