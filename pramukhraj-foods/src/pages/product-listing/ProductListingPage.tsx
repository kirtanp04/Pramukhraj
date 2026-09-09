import { MobileProductFilters } from '@/components/storefront/product-listing/MobileProductFilters'
import { ProductFilterSidebar } from '@/components/storefront/product-listing/ProductFilterSidebar'
import { ProductListingHeader } from '@/components/storefront/product-listing/ProductListingHeader'
import { ProductListingToolbar } from '@/components/storefront/product-listing/ProductListingToolbar'
import { ProductPagination } from '@/components/storefront/product-listing/ProductPagination'
import { ProductResults } from '@/components/storefront/product-listing/ProductResults'
import { useProductListing } from '@/hooks/product-listing/useProductListing'

export function ProductListingPage() {
  const listing = useProductListing()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <ProductListingHeader
        title={listing.pageTitle}
        description={listing.selectedCategoryDescription}
      />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Product filters" className="hidden lg:block">
          <ProductFilterSidebar filters={listing.filters} onChange={listing.updateFilters} />
        </aside>

        <section aria-label="Products" className="min-w-0">
          <ProductListingToolbar
            productCount={listing.filteredProductCount}
            sort={listing.sort}
            view={listing.view}
            onOpenFilters={() => listing.setMobileFiltersOpen(true)}
            onSortChange={listing.updateSort}
            onViewChange={listing.setView}
          />
          <ProductResults
            isLoading={listing.isLoading}
            products={listing.pageProducts}
            view={listing.view}
          />
          {!listing.isLoading && (
            <ProductPagination
              currentPage={listing.page}
              totalPages={listing.totalPages}
              onPageChange={listing.setPage}
            />
          )}
        </section>
      </div>

      <MobileProductFilters
        filters={listing.filters}
        isOpen={listing.mobileFiltersOpen}
        productCount={listing.filteredProductCount}
        onChange={listing.updateFilters}
        onClose={() => listing.setMobileFiltersOpen(false)}
      />
    </div>
  )
}
