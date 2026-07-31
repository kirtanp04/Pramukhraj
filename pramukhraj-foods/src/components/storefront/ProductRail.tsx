import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { Product } from '@/types/catalog'
import { ProductCard } from './ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'

export function ProductRail({
  title,
  eyebrow,
  products,
  viewAllHref,
  loading,
}: {
  title: string
  eyebrow?: string
  products: Product[]
  viewAllHref?: string
  loading?: boolean
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-5 flex items-end justify-between">
        <div>
          {eyebrow && <p className="mb-1 text-xs font-medium uppercase tracking-wider text-oxblood">{eyebrow}</p>}
          <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
        </div>
        {viewAllHref && (
          <Link to={viewAllHref} className="hidden items-center gap-1 text-sm font-medium text-oxblood hover:underline sm:flex">
            View All <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:thin] sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4.5] w-56 shrink-0 sm:w-auto" />)
          : products.map((p) => <ProductCard key={p.id} product={p} className="w-56 shrink-0 sm:w-auto" />)}
      </div>
      {viewAllHref && (
        <Link to={viewAllHref} className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-oxblood hover:underline sm:hidden">
          View All <ArrowRight size={14} />
        </Link>
      )}
    </section>
  )
}
