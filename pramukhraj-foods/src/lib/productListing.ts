import { productStatuses, type ProductStatus } from '@/constants/searchQueryParams'
import type { Product } from '@/types/catalog'
import type { ProductListingFilters, ProductListingQuery, ProductSortValue } from '@/types/productListing'

const validStatuses = new Set<string>(Object.values(productStatuses))
const validSortValues = new Set<ProductSortValue>([
  'popularity',
  'price-asc',
  'price-desc',
  'rating',
  'newest',
])

export function parseProductStatus(value: string | null): ProductStatus | undefined {
  return value && validStatuses.has(value) ? value as ProductStatus : undefined
}

export function parseProductSort(value: string | null): ProductSortValue {
  return value && validSortValues.has(value as ProductSortValue)
    ? value as ProductSortValue
    : 'popularity'
}

export function filterAndSortProducts(
  products: Product[],
  filters: ProductListingFilters,
  query: ProductListingQuery,
) {
  let result = products.filter((product) => product.price <= filters.maxPrice)

  if (filters.categorySlug) {
    result = result.filter((product) => product.category.slug === filters.categorySlug)
  }
  if (filters.brandSlugs.length > 0) {
    result = result.filter((product) => filters.brandSlugs.includes(product.brand.slug))
  }
  if (filters.minRating !== undefined) {
    result = result.filter((product) => product.rating >= filters.minRating!)
  }
  if (query.search) {
    const normalizedSearch = query.search.trim().toLowerCase()
    result = result.filter((product) =>
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch)),
    )
  }

  switch (query.status) {
    case productStatuses.deals:
      result = result.filter((product) => product.discountPercent > 0)
      break
    case productStatuses.featured:
      result = result.filter((product) => product.featured)
      break
    case productStatuses.trending:
      result = result.filter((product) => product.trending)
      break
    case productStatuses.bestSellers:
      result = result.filter((product) => product.bestSeller)
      break
    case productStatuses.newArrivals:
      result = result.filter((product) => product.newArrival)
      break
  }

  return result.toSorted((left, right) => {
    switch (query.sort) {
      case 'price-asc': return left.price - right.price
      case 'price-desc': return right.price - left.price
      case 'rating': return right.rating - left.rating
      case 'newest': return Number(right.newArrival) - Number(left.newArrival)
      default: return right.ordersCount - left.ordersCount
    }
  })
}
