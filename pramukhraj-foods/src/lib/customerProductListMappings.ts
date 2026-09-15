import type { Product } from '@/types/catalog'
import type { CustomerProductListItemResponse } from '@/types/customerProduct'

export function toCatalogListProduct(product: CustomerProductListItemResponse): Product {
  const discountPercent = product.mrp > product.price && product.mrp > 0
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0

  return {
    id: product.productId,
    productVariantId: product.productVariantId,
    sku: product.productVariantSku || product.sku,
    name: product.productName,
    slug: product.productSlug,
    description: product.shortDescription,
    longDescription: '',
    ingredients: [],
    nutrition: [],
    brand: {
      id: product.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: product.brand,
      slug: product.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      logo: '',
    },
    category: {
      id: product.categoryId,
      name: product.categoryName,
      slug: product.categorySlug,
      description: '',
      icon: '',
      image: '',
      productCount: 0,
    },
    subcategory: '',
    images: product.imageUrl ? [product.imageUrl] : [],
    thumbnail: product.imageUrl,
    price: product.price,
    mrp: product.mrp,
    discountPercent,
    stock: product.stockQuantity,
    weight: `${product.weight} ${product.weightUnit}`.trim(),
    unit: product.weightUnit,
    tags: [],
    rating: 0,
    reviewCount: 0,
    ordersCount: 0,
    featured: product.isFeatured,
    trending: product.isTrending,
    bestSeller: product.isBestSeller,
    newArrival: product.isNewArrival,
    organic: false,
    vegetarian: true,
    countryOfOrigin: 'India',
    manufacturer: '',
    returnPolicy: '',
    shippingTime: '',
    relatedProductIds: [],
    reviews: [],
  }
}
