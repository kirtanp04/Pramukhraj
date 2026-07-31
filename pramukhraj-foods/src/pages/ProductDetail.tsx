import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import * as Tabs from '@radix-ui/react-tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Share2, ShoppingBag, Truck, ShieldCheck, RotateCcw, Check, Minus } from 'lucide-react'
import { products } from '@/mock'
import { formatINR, cn } from '@/lib/utils'
import { Rating } from '@/components/ui/Rating'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { ProductRail } from '@/components/storefront/ProductRail'
import { useCartStore } from '@/store/cartStore'

export function ProductDetail() {
  const { slug } = useParams()
  const product = products.find((p) => p.slug === slug)
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const addToCart = useCartStore((s) => s.addToCart)
  const toggleWishlist = useCartStore((s) => s.toggleWishlist)
  const wishlist = useCartStore((s) => s.wishlist)

  useEffect(() => setActiveImage(0), [slug])

  if (!product) return <Navigate to="/products" replace />

  const related = products.filter((p) => product.relatedProductIds.includes(p.id))
  const isWishlisted = wishlist.includes(product.id)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <nav className="mb-5 flex flex-wrap gap-1 text-xs text-ink-soft">
        <Link to="/">Home</Link><span>/</span>
        <Link to={`/category/${product.category.slug}`}>{product.category.name}</Link><span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="scallop-top overflow-hidden rounded-card bg-tan">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                src={product.images[activeImage]}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="aspect-square w-full object-cover"
              />
            </AnimatePresence>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={cn(
                  'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2',
                  activeImage === i ? 'border-oxblood' : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            {product.bestSeller && <Badge variant="oxblood">Best Seller</Badge>}
            {product.organic && <Badge variant="teal">Organic</Badge>}
            {product.newArrival && <Badge variant="turmeric">New</Badge>}
          </div>
          <p className="mt-3 text-xs uppercase tracking-wide text-ink-soft">{product.brand.name}</p>
          <h1 className="mt-1 font-display text-3xl leading-tight">{product.name}</h1>
          <div className="mt-2"><Rating value={product.rating} count={product.reviewCount} size={16} /></div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-mono text-3xl font-semibold text-oxblood">{formatINR(product.price)}</span>
            {product.discountPercent > 0 && (
              <>
                <span className="font-mono text-lg text-ink-soft line-through">{formatINR(product.mrp)}</span>
                <Badge variant="oxblood">{product.discountPercent}% OFF</Badge>
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-soft">Inclusive of all taxes · {product.weight} pack</p>

          <p className="mt-5 text-sm leading-relaxed text-ink-soft">{product.description}</p>

          <div className="mt-5 flex items-center gap-2 text-sm">
            <span className="font-medium">Stock:</span>
            {product.stock > 0 ? (
              <span className="flex items-center gap-1 text-green-700"><Check size={14} /> In stock ({product.stock} left)</span>
            ) : (
              <span className="flex items-center gap-1 text-oxblood"><Minus size={14} /> Out of stock</span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, product.stock)} />
            <Button size="lg" disabled={product.stock === 0} onClick={() => addToCart(product.id, quantity)}>
              <ShoppingBag size={16} /> Add to Cart
            </Button>
            <Button size="lg" variant="secondary" disabled={product.stock === 0} onClick={() => addToCart(product.id, quantity)}>
              Buy Now
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button onClick={() => toggleWishlist(product.id)} className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-oxblood">
              <Heart size={16} className={cn(isWishlisted && 'fill-oxblood text-oxblood')} /> {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
            <button className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
              <Share2 size={16} /> Share
            </button>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 rounded-card bg-ivory-dim p-4 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-xs">
              <Truck size={16} className="shrink-0 text-oxblood" /> {product.shippingTime}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <RotateCcw size={16} className="shrink-0 text-oxblood" /> {product.returnPolicy}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck size={16} className="shrink-0 text-oxblood" /> 100% authentic, sealed packaging
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-14">
        <Tabs.Root defaultValue="description">
          <Tabs.List className="flex gap-6 border-b border-ink/10">
            {['description', 'ingredients', 'nutrition', `reviews (${product.reviews.length})`].map((tab) => {
              const value = tab.split(' ')[0]
              return (
                <Tabs.Trigger
                  key={value}
                  value={value}
                  className="border-b-2 border-transparent py-3 text-sm font-medium capitalize text-ink-soft data-[state=active]:border-oxblood data-[state=active]:text-oxblood"
                >
                  {tab}
                </Tabs.Trigger>
              )
            })}
          </Tabs.List>

          <Tabs.Content value="description" className="py-6 text-sm leading-relaxed text-ink-soft">
            <p>{product.longDescription}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div><dt className="text-ink-soft">SKU</dt><dd className="font-mono text-ink">{product.sku}</dd></div>
              <div><dt className="text-ink-soft">Country of Origin</dt><dd className="text-ink">{product.countryOfOrigin}</dd></div>
              <div><dt className="text-ink-soft">Manufacturer</dt><dd className="text-ink">{product.manufacturer}</dd></div>
            </dl>
          </Tabs.Content>

          <Tabs.Content value="ingredients" className="py-6 text-sm text-ink-soft">
            <ul className="list-inside list-disc space-y-1">
              {product.ingredients.map((ing) => <li key={ing}>{ing}</li>)}
            </ul>
          </Tabs.Content>

          <Tabs.Content value="nutrition" className="py-6">
            <table className="w-full max-w-sm text-sm">
              <tbody>
                {product.nutrition.map((n) => (
                  <tr key={n.label} className="border-b border-ink/10">
                    <td className="py-2 text-ink-soft">{n.label}</td>
                    <td className="py-2 text-right font-mono">{n.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-ink-soft">*Values per 100g serving, approximate.</p>
          </Tabs.Content>

          <Tabs.Content value="reviews" className="py-6">
            <div className="mb-6 flex items-center gap-4">
              <span className="font-display text-4xl">{product.rating.toFixed(1)}</span>
              <div>
                <Rating value={product.rating} size={16} />
                <p className="mt-1 text-xs text-ink-soft">Based on {product.reviewCount} reviews</p>
              </div>
            </div>
            <div className="space-y-5">
              {product.reviews.map((r) => (
                <div key={r.id} className="border-b border-ink/10 pb-5">
                  <div className="flex items-center gap-3">
                    <img src={r.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-medium">{r.author} {r.verified && <span className="ml-1 text-[10px] text-green-700">✓ Verified Purchase</span>}</p>
                      <Rating value={r.rating} size={12} />
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium">{r.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{r.comment}</p>
                </div>
              ))}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>

      {related.length > 0 && <ProductRail title="You May Also Like" products={related} />}
    </div>
  )
}
