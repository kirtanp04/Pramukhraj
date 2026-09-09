import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import { productSortOptions } from '@/constants/productListing'
import { cn } from '@/lib/utils'
import type { ProductListingView, ProductSortValue } from '@/types/productListing'

interface ProductListingToolbarProps {
  productCount: number
  sort: ProductSortValue
  view: ProductListingView
  onOpenFilters: () => void
  onSortChange: (sort: ProductSortValue) => void
  onViewChange: (view: ProductListingView) => void
}

export function ProductListingToolbar({
  productCount,
  sort,
  view,
  onOpenFilters,
  onSortChange,
  onViewChange,
}: ProductListingToolbarProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
      <p className="text-sm text-ink-soft" aria-live="polite">{productCount} products</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-sm lg:hidden"
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
        <select
          aria-label="Sort products"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as ProductSortValue)}
          className="rounded-full border border-ink/15 bg-ivory px-3 py-1.5 text-sm outline-none"
        >
          {productSortOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <div className="hidden items-center gap-1 rounded-full border border-ink/15 p-1 sm:flex" aria-label="Product view">
          {(['grid', 'list'] as const).map((option) => {
            const Icon = option === 'grid' ? LayoutGrid : List
            return (
              <button
                type="button"
                key={option}
                onClick={() => onViewChange(option)}
                aria-label={`${option === 'grid' ? 'Grid' : 'List'} view`}
                aria-pressed={view === option}
                className={cn(
                  'rounded-full p-1.5',
                  view === option ? 'bg-oxblood text-ivory' : 'text-ink-soft',
                )}
              >
                <Icon size={14} />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
