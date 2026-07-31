import { categories, products } from '@/mock'
import type { Product } from '@/types/catalog'

const delay = (ms = 250) => new Promise((res) => setTimeout(res, ms))

export interface ProductFilters {
  categorySlug?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  brands?: string[]
  sort?: 'popularity' | 'price-asc' | 'price-desc' | 'rating' | 'newest'
}

export async function fetchCategories() {
  await delay(150)
  return categories
}

export async function fetchCategoryBySlug(slug: string) {
  await delay(150)
  return categories.find((c) => c.slug === slug) ?? null
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  await delay(300)
  let result = [...products]

  if (filters.categorySlug) {
    result = result.filter((p) => p.category.slug === filters.categorySlug)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (p) => p.name.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }
  if (filters.minPrice != null) result = result.filter((p) => p.price >= filters.minPrice!)
  if (filters.maxPrice != null) result = result.filter((p) => p.price <= filters.maxPrice!)
  if (filters.minRating != null) result = result.filter((p) => p.rating >= filters.minRating!)
  if (filters.brands?.length) result = result.filter((p) => filters.brands!.includes(p.brand.slug))

  switch (filters.sort) {
    case 'price-asc': result.sort((a, b) => a.price - b.price); break
    case 'price-desc': result.sort((a, b) => b.price - a.price); break
    case 'rating': result.sort((a, b) => b.rating - a.rating); break
    case 'newest': result.sort((a, b) => Number(b.newArrival) - Number(a.newArrival)); break
    default: result.sort((a, b) => b.ordersCount - a.ordersCount)
  }
  return result
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  await delay(250)
  return products.find((p) => p.slug === slug) ?? null
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  await delay(150)
  return products.filter((p) => ids.includes(p.id))
}

export async function fetchFeatured() {
  await delay(200)
  return products.filter((p) => p.featured).slice(0, 8)
}

export async function fetchTrending() {
  await delay(200)
  return products.filter((p) => p.trending).slice(0, 8)
}

export async function fetchBestSellers() {
  await delay(200)
  return products.filter((p) => p.bestSeller).slice(0, 8)
}

export async function fetchNewArrivals() {
  await delay(200)
  return products.filter((p) => p.newArrival).slice(0, 8)
}

export async function fetchDeals() {
  await delay(200)
  return [...products].sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 8)
}
