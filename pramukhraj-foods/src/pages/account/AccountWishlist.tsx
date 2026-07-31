import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { products } from '@/mock'
import { ProductCard } from '@/components/storefront/ProductCard'
import { Button } from '@/components/ui/Button'

export function AccountWishlist() {
  const wishlist = useCartStore((s) => s.wishlist)
  const items = products.filter((p) => wishlist.includes(p.id))

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-card border border-dashed border-ink/15 py-16 text-center">
        <Heart size={32} className="text-ink-soft" />
        <p className="mt-3 font-display text-lg">Your wishlist is empty</p>
        <p className="mt-1 text-sm text-ink-soft">Save items you love for later.</p>
        <Button className="mt-5" asChild><Link to="/products">Browse Products</Link></Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-4 font-display text-xl">My Wishlist ({items.length})</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}
