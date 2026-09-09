import type { Product } from '@/types/catalog'

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
