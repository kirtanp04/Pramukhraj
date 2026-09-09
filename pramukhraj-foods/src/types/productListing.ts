import type { ProductStatus } from '@/constants/searchQueryParams'

export type ProductListingView = 'grid' | 'list'

export type ProductSortValue =
  | 'popularity'
  | 'price-asc'
  | 'price-desc'
  | 'rating'
  | 'newest'

export interface ProductListingFilters {
  categorySlug?: string
  brandSlugs: string[]
  maxPrice: number
  minRating?: number
}

export interface ProductListingQuery {
  search: string
  sort: ProductSortValue
  status?: ProductStatus
}
