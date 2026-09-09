import { PackageSearch } from 'lucide-react'
import { ProductCard } from '@/components/storefront/ProductCard'
import { ProductListRow } from '@/components/storefront/product-listing/ProductListRow'
import { Skeleton } from '@/components/ui/Skeleton'
import { PRODUCT_LISTING_SKELETON_COUNT } from '@/constants/productListing'
import type { Product } from '@/types/catalog'
import type { ProductListingView } from '@/types/productListing'

interface ProductResultsProps {
  isLoading: boolean
  products: Product[]
  view: ProductListingView
}

export function ProductResults({ isLoading, products, view }: ProductResultsProps) {
  if (isLoading) return <ProductResultsSkeleton view={view} />
  if (products.length === 0) return <EmptyProductResults />

  if (view === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {products.map((product) => <ProductListRow key={product.id} product={product} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
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
