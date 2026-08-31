import type { ProductCategoryDetailsResponse } from '@/types/productCategory'
import type { AddProductCategoryRequest } from '@/types/productCategorySchema'
import type { ProductDetailsResponse, ProductFormValues } from '@/types/productSchema'

export function mapProductResponseToForm(product: ProductDetailsResponse): ProductFormValues {
  return {
    categoryId: product.categoryId,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    brand: product.brand,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    isTrending: product.isTrending,
    isNewArrival: product.isNewArrival,
    isActive: product.isActive,
    countryOfOrigin: product.countryOfOrigin,
    isVegetarian: product.isVegetarian,
    shelfLife: product.shelfLife,
    storageInstruction: product.storageInstruction,
    ingredients: product.ingredients,
    nutritionalInformation: product.nutritionalInformation,
    barcode: product.barcode || null,
    images: product.images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText,
      isPrimary: image.isPrimary,
      displayOrder: image.displayOrder,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: variant.price,
      mrp: variant.mrp,
      stockQuantity: variant.stockQuantity,
      weight: variant.weight,
      weightUnit: variant.weightUnit,
      isDefault: variant.isDefault,
      isActive: variant.isActive,
    })),
    tags: product.tags.map((tag) => ({ id: tag.id, name: tag.name })),
  }
}

export function mapCategoryResponseToForm(
  category: ProductCategoryDetailsResponse,
): AddProductCategoryRequest {
  return {
    name: category.name,
    description: category.description,
    imageUrl: category.imageUrl,
    displayOrder: category.displayOrder,
    isFeatured: category.isFeatured,
    isActive: category.isActive,
  }
}
