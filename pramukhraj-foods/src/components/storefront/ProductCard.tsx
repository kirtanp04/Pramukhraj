import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingBag } from 'lucide-react'
import type { Product } from '@/types/catalog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn, formatINR } from '@/lib/utils'
import { getProductStatusBadge } from '@/lib/productStatusBadge'
import { useCartStore } from '@/store/cartStore'
import type { ProductStatus } from '@/constants/searchQueryParams'
import { LazyProductImage } from './LazyProductImage'
import { LowStockNotice } from './LowStockNotice'

interface ProductCardProps {
  product: Product
  className?: string
  selectedStatus?: ProductStatus | null
}

export function ProductCard({ product, className, selectedStatus }: ProductCardProps) {
  const addToCart = useCartStore((s) => s.addToCart)
  const toggleWishlist = useCartStore((s) => s.toggleWishlist)
  const wishlist = useCartStore((s) => s.wishlist)
  const isWishlisted = wishlist.includes(product.id)

  const badge = getProductStatusBadge(product, selectedStatus)

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={cn('group relative flex flex-col overflow-hidden rounded-lg bg-ivory-dim shadow-sm hover:shadow-lg transition-shadow', className)}
    >
      {/* <div className="scallop-top h-3 w-full bg-ivory-dim" aria-hidden /> */}
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-tan">
        <LazyProductImage
          productId={product.id}
          src={product.thumbnail}
          alt={product.name}
        />
        {badge && (
          <Badge variant={badge.variant} className="absolute left-3 top-3">
            {badge.label}
          </Badge>
        )}
        {product.discountPercent > 0 && (
          <Badge variant="oxblood" className="absolute right-3 top-3">
            {product.discountPercent}% OFF
          </Badge>
        )}
        <button
          type="button"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.preventDefault()
            toggleWishlist(product.id)
          }}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ivory/90 text-ink shadow-sm backdrop-blur transition-transform hover:scale-110"
        >
          <Heart size={16} className={cn(isWishlisted && 'fill-oxblood text-oxblood')} />
        </button>
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/50">
            <span className="stamp-badge rounded-full bg-ivory px-3 py-1 text-xs">Out of Stock</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-[11px] uppercase tracking-wide text-ink-soft">{product.brand.name}</span>
        <Link to={`/product/${product.slug}`} className="line-clamp-2 font-display text-[15px] leading-snug hover:text-oxblood">
          {product.name}
        </Link>
        <span className="text-[11px] uppercase tracking-wide text-ink-soft">{product.category.name}</span>
        {/* <Rating value={product.rating} count={product.reviewCount} /> */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-base font-semibold text-oxblood">{formatINR(product.price)}</span>
          {product.discountPercent > 0 && (
            <span className="font-mono text-xs text-ink-soft line-through">{formatINR(product.mrp)}</span>
          )}
          <span className="text-xs text-ink-soft">/ {product.weight}</span>
        </div>
        <p className="text-[10px]! text-ink-soft/80">Incl. of all taxes</p>
        <LowStockNotice stock={product.stock} />
        <Button
          size="sm"
          variant="outline"
          className="mt-2 w-full group-hover:bg-oxblood group-hover:text-ivory group-hover:border-oxblood"
          disabled={product.stock === 0}
          onClick={() => void addToCart(product.productVariantId ?? product.id)}
        >
          <ShoppingBag size={14} /> Add to Cart
        </Button>
      </div>
    </motion.div>
  )
}
