import { PRODUCT_PRICE_CEILING } from '@/constants/productListing'
import { productStatuses, type ProductStatus } from '@/constants/searchQueryParams'
import type { CustomerProductSort, CustomerProductStatus } from '@/types/customerProduct'
import type { ProductSortValue } from '@/types/productListing'

const validStatuses = new Set<string>(Object.values(productStatuses))
const validCategorySlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const maximumSearchLength = 100

const apiProductStatuses: Record<ProductStatus, CustomerProductStatus> = {
  [productStatuses.newArrivals]: 0,
  [productStatuses.bestSellers]: 1,
  [productStatuses.trending]: 2,
  [productStatuses.featured]: 3,
  [productStatuses.deals]: 4,
}

export function parseProductStatus(value: string | null): ProductStatus | undefined {
  return value && validStatuses.has(value) ? value as ProductStatus : undefined
}

export function parseProductSort(value: string | null): ProductSortValue {
  return value === 'price-desc' ? 'price-desc' : 'price-asc'
}

export function parseProductPage(value: string | null): number {
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

export function parseProductMaxPrice(value: string | null): number {
  if (value === null || value.trim() === '') return PRODUCT_PRICE_CEILING
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 && price <= PRODUCT_PRICE_CEILING
    ? Math.round(price)
    : PRODUCT_PRICE_CEILING
}

export function parseProductCategorySlug(value: string | null): string | undefined {
  const slug = value?.trim().toLowerCase()
  return slug && validCategorySlug.test(slug) ? slug : undefined
}

export function parseProductSearch(value: string | null): string {
  return (value ?? '').trim().slice(0, maximumSearchLength)
}

export function toCustomerProductSort(sort: ProductSortValue): CustomerProductSort {
  return sort === 'price-desc' ? 1 : 0
}

export function toCustomerProductStatus(
  status: ProductStatus | undefined,
): CustomerProductStatus | undefined {
  return status === undefined ? undefined : apiProductStatuses[status]
}
