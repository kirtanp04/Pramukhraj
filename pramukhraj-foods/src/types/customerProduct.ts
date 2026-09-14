import type { Product } from '@/types/catalog'

export type CustomerProductSort = 0 | 1
export type CustomerProductStatus = 0 | 1 | 2 | 3 | 4

export interface CustomerProductListRequest {
  categoryId?: string
  search?: string
  page: number
  pageSize: number
  maxPrice: number
  sortBy: CustomerProductSort
  productStatus?: CustomerProductStatus
}

export interface CustomerProductListItemResponse {
  productId: string
  productName: string
  productSlug: string
  categoryId: string
  categoryName: string
  categorySlug: string
  brand: string
  shortDescription: string
  price: number
  mrp: number
  sku: string
  weightUnit: string
  weight: number
  productVariantId: string
  productVariantSku: string
  stockQuantity: number
  isLowStock: boolean
  isFeatured: boolean
  isBestSeller: boolean
  isNewArrival: boolean
  isTrending: boolean
  imageUrl: string
}

export interface CustomerProductListResponse {
  products: CustomerProductListItemResponse[]
  totalCount: number
  page: number
  pageSize: number
}

export interface CustomerProductCardResponse {
  id: string
  categoryId: string
  categoryName: string
  name: string
  slug: string
  imageUrl: string
  price: number
  mrp: number
  weight: number
  weightUnit: string
  isInStock: boolean
  isFeatured: boolean
  isBestSeller: boolean
  isNewArrival: boolean
  isTrending: boolean
}

export interface CustomerHomeProductGroupsResponse {
  featuredProducts: CustomerProductCardResponse[]
  bestSellerProducts: CustomerProductCardResponse[]
  newArrivalProducts: CustomerProductCardResponse[]
  trendingProducts: CustomerProductCardResponse[]
}

export interface CustomerHomeProductGroups {
  featured: Product[]
  bestSellers: Product[]
  newArrivals: Product[]
  trending: Product[]
}

export interface CustomerProductImage {
  productId: string
  imageurl: string
}

export type CustomerProductImagesDictionary = Record<string, CustomerProductImage>
