import type { Product } from '@/types/catalog'
import type {
  CustomerHomeProductGroups,
  CustomerHomeProductGroupsResponse,
  CustomerProductCardResponse,
} from '@/types/customerProduct'

export function toCatalogProduct(product: CustomerProductCardResponse): Product {
  const discountPercent = product.mrp > product.price && product.mrp > 0
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0

  return {
    id: product.id,
    productVariantId: product.productVariantId,
    sku: '',
    name: product.name,
    slug: product.slug,
    description: '',
    longDescription: '',
    ingredients: [],
    nutrition: [],
    brand: { id: '', name: 'Pramukhraj', slug: 'pramukhraj', logo: '' },
    category: {
      id: product.categoryId,
      name: product.categoryName,
      slug: '',
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
    stock: product.isInStock ? 1 : 0,
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

export function toCustomerHomeProductGroups(
  response: CustomerHomeProductGroupsResponse,
): CustomerHomeProductGroups {
  return {
    featured: (response.featuredProducts ?? []).map(toCatalogProduct),
    bestSellers: (response.bestSellerProducts ?? []).map(toCatalogProduct),
    newArrivals: (response.newArrivalProducts ?? []).map(toCatalogProduct),
    trending: (response.trendingProducts ?? []).map(toCatalogProduct),
  }
}
