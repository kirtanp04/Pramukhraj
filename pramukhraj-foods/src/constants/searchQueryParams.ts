export const searchQueryParams = {
  page: 'page',
  category: 'category',
  search: 'search',
  sort: 'sort',
  status: 'status',
} as const

export const productStatuses = {
  deals: 'deals',
  featured: 'featured',
  trending: 'trending',
  bestSellers: 'best-sellers',
  newArrivals: 'new-arrivals',
} as const

export type ProductStatus = typeof productStatuses[keyof typeof productStatuses]

export function productsByCategoryUrl(categorySlug: string) {
  return `/products?${searchQueryParams.category}=${encodeURIComponent(categorySlug)}`
}

export function productsByStatusUrl(status: ProductStatus) {
  return `/products?${searchQueryParams.status}=${encodeURIComponent(status)}`
}
