import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import { formatINR } from '@/lib/utils'
import type { Product } from '@/types/catalog'

export function ProductListRow({ product }: { product: Product }) {
  return (
    <article className="flex gap-4 rounded-card border border-ink/10 p-4">
      <img src={product.thumbnail} alt={product.name} loading="lazy" className="h-28 w-28 shrink-0 rounded-lg object-cover" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs uppercase text-ink-soft">{product.brand.name}</span>
        <Link to={`/product/${product.slug}`} className="font-display text-lg hover:text-oxblood">{product.name}</Link>
        <Rating value={product.rating} count={product.reviewCount} />
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-semibold text-oxblood">{formatINR(product.price)}</span>
            {product.discountPercent > 0 && (
              <span className="font-mono text-xs text-ink-soft line-through">{formatINR(product.mrp)}</span>
            )}
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/product/${product.slug}`}>View</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
