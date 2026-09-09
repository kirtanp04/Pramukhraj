import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { ProductFilterSidebar } from '@/components/storefront/product-listing/ProductFilterSidebar'
import { Button } from '@/components/ui/Button'
import type { ProductListingFilters } from '@/types/productListing'

interface MobileProductFiltersProps {
  filters: ProductListingFilters
  isOpen: boolean
  productCount: number
  onChange: (filters: ProductListingFilters) => void
  onClose: () => void
}

export function MobileProductFilters({
  filters,
  isOpen,
  productCount,
  onChange,
  onClose,
}: MobileProductFiltersProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close filters"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40 lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            aria-label="Product filters"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-ivory p-5 lg:hidden"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg">Filters</h2>
              <button type="button" onClick={onClose} aria-label="Close filters"><X size={20} /></button>
            </div>
            <ProductFilterSidebar filters={filters} onChange={onChange} />
            <Button className="mt-4 w-full" onClick={onClose}>Show {productCount} results</Button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
