export interface AdminInventoryItem {
  /** Product variant identifier. */
  id: string
  productId: string
  name: string
  slug: string
  categoryId: string
  categoryName: string
  stock: number
  imageUrl: string
  weight: number
  weightUnit: string
  isVariantActive: boolean
  isProductActive: boolean
}

export interface InventoryProductImage {
  productId: string
  imageurl: string
}

export interface GetInventoryProductImagesRequest {
  productIds: string[]
}

export type InventoryProductImagesDictionary = Record<string, InventoryProductImage>

export interface UpdateVariantInventoryRequest {
  productId: string
  variantId: string
  stock: number
  isActive: boolean
}

export interface UpdateVariantInventoryResponse {
  productId: string
  variantId: string
  stock: number
  isActive: boolean
}
