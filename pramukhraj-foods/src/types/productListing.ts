export type ProductListingView = 'grid' | 'list'

export type ProductSortValue =
  | 'price-asc'
  | 'price-desc'

export interface ProductListingFilters {
  categorySlug?: string
  maxPrice: number
}
