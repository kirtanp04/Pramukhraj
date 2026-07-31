import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Category } from '@/types/catalog'

export function CategoryCard({ category }: { category: Category }) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
      <Link
        to={`/category/${category.slug}`}
        className="group flex flex-col items-center gap-3 rounded-2xl p-3 text-center transition-colors hover:bg-tan/60"
      >
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-turmeric/40 shadow-sm sm:h-24 sm:w-24">
          <img src={category.image} alt={category.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        </div>
        <div>
          <p className="font-display text-sm font-medium sm:text-base">{category.name}</p>
          <p className="text-xs text-ink-soft">{category.productCount} items</p>
        </div>
      </Link>
    </motion.div>
  )
}
