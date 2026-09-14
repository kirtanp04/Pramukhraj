import { LoaderCircle, PackageSearch, TriangleAlert } from 'lucide-react'
import { ProductCard } from '@/components/storefront/ProductCard'
import { ProductListRow } from '@/components/storefront/product-listing/ProductListRow'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { PRODUCT_LISTING_SKELETON_COUNT } from '@/constants/productListing'
import type { ProductStatus } from '@/constants/searchQueryParams'
import type { Product } from '@/types/catalog'
import type { ProductListingView } from '@/types/productListing'

interface ProductResultsProps {
  error: string | null
  isLoading: boolean
  products: Product[]
  selectedStatus?: ProductStatus
  onRetry: () => void
  view: ProductListingView
}

export function ProductResults({ error, isLoading, products, onRetry, selectedStatus, view }: ProductResultsProps) {
  if (isLoading && products.length === 0) return <ProductResultsSkeleton view={view} />
  if (error) return <ProductResultsError message={error} onRetry={onRetry} />
  if (products.length === 0) return <EmptyProductResults />

  return (
    <div className="relative" aria-busy={isLoading}>
      <div className={isLoading ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'}>
        {view === 'list' ? (
          <div className="flex flex-col gap-4">
            {products.map((product) => <ProductListRow key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selectedStatus={selectedStatus ?? null}
              />
            ))}
          </div>
        )}
      </div>
      {isLoading && (
        <div
          role="status"
          className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ivory px-4 py-2 text-sm text-ink shadow-md"
        >
          <LoaderCircle size={16} className="animate-spin text-oxblood" aria-hidden="true" />
          Updating products…
        </div>
      )}
    </div>
  )
}

function ProductResultsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-card border border-dashed border-oxblood/25 bg-oxblood/5 px-6 py-20 text-center"
    >
      <TriangleAlert size={32} className="text-oxblood" aria-hidden="true" />
      <p className="mt-4 font-display text-xl">Unable to load products</p>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{message}</p>
      <Button type="button" variant="outline" size="sm" className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function ProductResultsSkeleton({ view }: { view: ProductListingView }) {
  if (view === 'list') {
    return (
      <div className="flex flex-col gap-4" aria-label="Loading products">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex gap-4 rounded-card border border-ink/10 p-4">
            <Skeleton className="h-28 w-28 shrink-0" />
            <div className="flex-1 space-y-3 py-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" aria-label="Loading products">
      {Array.from({ length: PRODUCT_LISTING_SKELETON_COUNT }, (_, index) => (
        <Skeleton key={index} className="aspect-[3/4.5]" />
      ))}
    </div>
  )
}

function EmptyProductResults() {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-ink/15 px-6 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tan text-ink-soft">
        <PackageSearch size={28} aria-hidden="true" />
      </div>
      <p className="font-display text-xl">No products found</p>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">Try adjusting your filters or search for something else.</p>
    </div>
  )
}
