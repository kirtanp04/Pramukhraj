import { Link } from 'react-router-dom'
import { LazyProductImage } from '@/components/storefront/LazyProductImage'
import { LowStockNotice } from '@/components/storefront/LowStockNotice'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatINR } from '@/lib/utils'
import type { Product } from '@/types/catalog'

export function ProductListRow({ product }: { product: Product }) {
  return (
    <article className="flex gap-4 rounded-card border border-ink/10 p-4">
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-tan">
        <LazyProductImage productId={product.id} src={product.thumbnail} alt={product.name} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs uppercase text-ink-soft">{product.brand.name}</span>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/product/${product.slug}`} className="font-display text-lg hover:text-oxblood">{product.name}</Link>
          {product.stock === 0 && <Badge variant="oxblood">Out of Stock</Badge>}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{product.description}</p>
        <LowStockNotice stock={product.stock} className="mt-1" />
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
