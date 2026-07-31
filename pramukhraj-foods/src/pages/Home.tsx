import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hero } from '@/components/storefront/Hero'
import { ProductRail } from '@/components/storefront/ProductRail'
import { CategoryCard } from '@/components/storefront/CategoryCard'
import { Testimonials } from '@/components/storefront/Testimonials'
import { FAQSection } from '@/components/storefront/FAQSection'
import { BlogPreview } from '@/components/storefront/BlogPreview'
import { categories } from '@/mock'
import type { Product } from '@/types/catalog'
import { fetchTrending, fetchBestSellers, fetchNewArrivals, fetchDeals } from '@/services/catalogService'

export function Home() {
  const [trending, setTrending] = useState<Product[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [deals, setDeals] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchTrending(), fetchBestSellers(), fetchNewArrivals(), fetchDeals()]).then(
      ([t, b, n, d]) => {
        setTrending(t)
        setBestSellers(b)
        setNewArrivals(n)
        setDeals(d)
        setLoading(false)
      },
    )
  }, [])

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl sm:text-3xl">Shop by Category</h2>
          <Link to="/products" className="hidden text-sm font-medium text-oxblood hover:underline sm:block">Browse all</Link>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      <ProductRail title="Today's Deals" eyebrow="Limited time" products={deals} viewAllHref="/products?deals=1" loading={loading} />
      <ProductRail title="Trending Now" eyebrow="Popular this week" products={trending} viewAllHref="/products?sort=popularity" loading={loading} />
      <ProductRail title="Best Sellers" eyebrow="Customer favourites" products={bestSellers} viewAllHref="/products?filter=bestseller" loading={loading} />
      <ProductRail title="New Arrivals" eyebrow="Just landed" products={newArrivals} viewAllHref="/products?sort=newest" loading={loading} />

      <Testimonials />
      <BlogPreview />
      <FAQSection />
    </>
  )
}
