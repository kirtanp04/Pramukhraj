export interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  image: string
  productCount: number
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string
}

export interface Review {
  id: string
  author: string
  avatar: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
  helpful: number
}

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description: string
  longDescription: string
  ingredients: string[]
  nutrition: { label: string; value: string }[]
  brand: Brand
  category: Category
  subcategory: string
  images: string[]
  thumbnail: string
  price: number
  mrp: number
  discountPercent: number
  stock: number
  weight: string
  unit: string
  tags: string[]
  rating: number
  reviewCount: number
  ordersCount: number
  featured: boolean
  trending: boolean
  bestSeller: boolean
  newArrival: boolean
  organic: boolean
  vegetarian: boolean
  countryOfOrigin: string
  manufacturer: string
  returnPolicy: string
  shippingTime: string
  relatedProductIds: string[]
  reviews: Review[]
}

export interface CartLine {
  productId: string
  quantity: number
}
