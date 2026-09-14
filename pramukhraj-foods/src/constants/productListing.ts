import { productStatuses, type ProductStatus } from '@/constants/searchQueryParams'
import type { ProductSortValue } from '@/types/productListing'

export const PRODUCT_LISTING_PAGE_SIZE = 20
export const PRODUCT_PRICE_CEILING = 1000
export const PRODUCT_LISTING_SKELETON_COUNT = 8

export const productSortOptions: ReadonlyArray<{
  value: ProductSortValue
  label: string
}> = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

export const productStatusTitles: Record<ProductStatus, string> = {
  [productStatuses.deals]: "Today's Deals",
  [productStatuses.featured]: 'Featured Products',
  [productStatuses.trending]: 'Trending Products',
  [productStatuses.bestSellers]: 'Best Sellers',
  [productStatuses.newArrivals]: 'New Arrivals',
}
