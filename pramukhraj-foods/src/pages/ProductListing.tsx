import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react'
import { ProductCard } from '@/components/storefront/ProductCard'
import { FilterSidebar, type Filters } from '@/components/storefront/FilterSidebar'
import { Skeleton } from '@/components/ui/Skeleton'
import { Rating } from '@/components/ui/Rating'
import { Button } from '@/components/ui/Button'
import { categories, products as allProducts } from '@/mock'
import { formatINR } from '@/lib/utils'
import type { Product } from '@/types/catalog'

const PAGE_SIZE = 12

export function ProductListing() {
  const { categorySlug: routeCategory } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const sortParam = searchParams.get('sort') ?? 'popularity'
  const isDeals = searchParams.get('deals') === '1'
  const isBestSeller = searchParams.get('filter') === 'bestseller'

  const [filters, setFilters] = useState<Filters>({ categorySlug: routeCategory, brandSlugs: [], maxPrice: 900 })
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setFilters((f) => ({ ...f, categorySlug: routeCategory }))
    setPage(1)
  }, [routeCategory])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 350)
    return () => clearTimeout(t)
  }, [filters, search, sortParam, page, isDeals, isBestSeller])

  const category = categories.find((c) => c.slug === (routeCategory ?? filters.categorySlug))

  const filtered = useMemo(() => {
    let result = [...allProducts]
    if (filters.categorySlug) result = result.filter((p) => p.category.slug === filters.categorySlug)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)))
    }
    if (filters.brandSlugs.length) result = result.filter((p) => filters.brandSlugs.includes(p.brand.slug))
    result = result.filter((p) => p.price <= filters.maxPrice)
    if (filters.minRating) result = result.filter((p) => p.rating >= filters.minRating!)
    if (isDeals) result = result.filter((p) => p.discountPercent > 0)
    if (isBestSeller) result = result.filter((p) => p.bestSeller)

    switch (sortParam) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break
      case 'price-desc': result.sort((a, b) => b.price - a.price); break
      case 'rating': result.sort((a, b) => b.rating - a.rating); break
      case 'newest': result.sort((a, b) => Number(b.newArrival) - Number(a.newArrival)); break
      default: result.sort((a, b) => b.ordersCount - a.ordersCount)
    }
    return result
  }, [filters, search, sortParam, isDeals, isBestSeller])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function updateSort(value: string) {
    const next = new URLSearchParams(searchParams)
    next.set('sort', value)
    setSearchParams(next)
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <nav className="mb-3 text-xs text-ink-soft">
        <span>Home</span> <span className="mx-1">/</span> <span>{category ? category.name : search ? `Search: "${search}"` : 'All Products'}</span>
      </nav>
      <h1 className="font-display text-3xl">{category ? category.name : search ? `Results for "${search}"` : 'All Products'}</h1>
      {category && <p className="mt-2 max-w-2xl text-sm text-ink-soft">{category.description}</p>}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <FilterSidebar filters={filters} onChange={(f) => { setFilters(f); setPage(1) }} />
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
            <p className="text-sm text-ink-soft">{filtered.length} products</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-sm lg:hidden"
              >
                <SlidersHorizontal size={14} /> Filters
              </button>
              <select
                value={sortParam}
                onChange={(e) => updateSort(e.target.value)}
                className="rounded-full border border-ink/15 bg-ivory px-3 py-1.5 text-sm outline-none"
              >
                <option value="popularity">Sort: Popularity</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
              <div className="hidden items-center gap-1 rounded-full border border-ink/15 p-1 sm:flex">
                <button onClick={() => setView('grid')} className={`rounded-full p-1.5 ${view === 'grid' ? 'bg-oxblood text-ivory' : 'text-ink-soft'}`} aria-label="Grid view">
                  <LayoutGrid size={14} />
                </button>
                <button onClick={() => setView('list')} className={`rounded-full p-1.5 ${view === 'list' ? 'bg-oxblood text-ivory' : 'text-ink-soft'}`} aria-label="List view">
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className={view === 'grid' ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4' : 'flex flex-col gap-4'}>
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4.5]" />)}
            </div>
          ) : pageItems.length === 0 ? (
            <EmptyResults />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {pageItems.map((p) => <ProductListRow key={p.id} product={p} />)}
            </div>
          )}

          {totalPages > 1 && !loading && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-9 w-9 rounded-full text-sm ${page === i + 1 ? 'bg-oxblood text-ivory' : 'text-ink-soft hover:bg-ink/5'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-ink/40 lg:hidden" onClick={() => setMobileFiltersOpen(false)} />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-ivory p-5 lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg">Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters"><X size={20} /></button>
              </div>
              <FilterSidebar filters={filters} onChange={(f) => { setFilters(f); setPage(1) }} />
              <Button className="mt-4 w-full" onClick={() => setMobileFiltersOpen(false)}>Show {filtered.length} results</Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProductListRow({ product }: { product: Product }) {
  return (
    <div className="flex gap-4 rounded-card border border-ink/10 p-4">
      <img src={product.thumbnail} alt={product.name} className="h-28 w-28 shrink-0 rounded-lg object-cover" />
      <div className="flex flex-1 flex-col">
        <span className="text-xs uppercase text-ink-soft">{product.brand.name}</span>
        <p className="font-display text-lg">{product.name}</p>
        <Rating value={product.rating} count={product.reviewCount} />
        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg font-semibold text-oxblood">{formatINR(product.price)}</span>
            {product.discountPercent > 0 && <span className="font-mono text-xs text-ink-soft line-through">{formatINR(product.mrp)}</span>}
          </div>
          <Button size="sm" variant="outline">View</Button>
        </div>
      </div>
    </div>
  )
}

function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-ink/15 py-20 text-center">
      <div className="scallop-bottom scallop-top mb-4 h-16 w-16 rounded-full bg-tan" />
      <p className="font-display text-xl">No products found</p>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">Try adjusting your filters or search for something else.</p>
    </div>
  )
}
