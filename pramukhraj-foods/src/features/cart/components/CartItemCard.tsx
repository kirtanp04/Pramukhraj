import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { formatINR, cn } from '@/lib/utils'
import type { CartItem } from '../types/cart.types'
import { fallbackProductImage } from '../utils/cart.utils'
import { CartQuantityControl } from './CartQuantityControl'
import { CartStockBadge } from './CartStockBadge'
import { CartVariantSelector } from './CartVariantSelector'

interface Props {
  item: CartItem
  authenticated: boolean
  disabled: boolean
  onQuantity: (value: number) => void
  onRemove: () => void
  onSelection: (value: boolean) => void
  onVariant: (id: string) => void
}

export function CartItemCard({ item, authenticated, disabled, onQuantity, onRemove, onSelection, onVariant }: Props) {
  return <article className={cn('flex gap-4 rounded-card border border-ink/10 bg-white p-4',
    !item.isProductActive || !item.isVariantActive ? 'opacity-65' : '')}>
    {authenticated && <input type="checkbox" aria-label={`Select ${item.productName} for checkout`}
      checked={item.isSelected} disabled={disabled} onChange={event => onSelection(event.target.checked)}
      className="mt-2 accent-oxblood" />}
    <Link to={`/product/${item.productSlug}`} className="shrink-0">
      <img src={item.imageUrl || fallbackProductImage}
        onError={event => { event.currentTarget.src = fallbackProductImage }} alt={item.productName}
        className="h-24 w-24 rounded-lg bg-tan object-cover sm:h-28 sm:w-28" />
    </Link>
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div><Link to={`/product/${item.productSlug}`} className="font-display text-base hover:text-oxblood sm:text-lg">{item.productName}</Link>
          <p className="mt-1 text-xs text-ink-soft">{item.variantName} · {item.weight} {item.weightUnit}</p></div>
        <span className="shrink-0 font-mono font-semibold text-oxblood">{formatINR(item.lineSubtotal)}</span>
      </div>
      <div className="mt-2"><CartStockBadge status={item.stockStatus} message={item.stockMessage} /></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <CartQuantityControl value={item.quantity} canDecrease={item.canDecreaseQuantity}
          canIncrease={item.canIncreaseQuantity} disabled={disabled} onChange={onQuantity} />
        <CartVariantSelector options={item.otherVariants} disabled={disabled} onChange={onVariant} />
        <button type="button" onClick={onRemove} disabled={disabled}
          className="flex items-center gap-1 text-xs text-ink-soft hover:text-oxblood disabled:opacity-40">
          <Trash2 size={14} /> Remove
        </button>
      </div>
    </div>
  </article>
}
