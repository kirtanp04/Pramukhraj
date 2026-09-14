import { useEffect, useState, type ReactNode } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import * as Slider from '@radix-ui/react-slider'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { PRODUCT_PRICE_CEILING } from '@/constants/productListing'
import { useCustomerCategories } from '@/hooks/useCustomerCategoriesContext'
import { cn } from '@/lib/utils'
import type { ProductListingFilters } from '@/types/productListing'

interface ProductFilterSidebarProps {
  filters: ProductListingFilters
  onChange: (filters: ProductListingFilters) => void
  onClear: () => void
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Accordion.Item value={title} className="border-b border-ink/10 py-4">
      <Accordion.Header>
        <Accordion.Trigger className="group flex w-full items-center justify-between text-sm font-semibold">
          {title}
          <ChevronDown size={14} className="transition-transform group-data-[state=open]:rotate-180" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="pt-3">{children}</Accordion.Content>
    </Accordion.Item>
  )
}

export function ProductFilterSidebar({ filters, onChange, onClear }: ProductFilterSidebarProps) {
  const [pendingMaxPrice, setPendingMaxPrice] = useState(filters.maxPrice)
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCustomerCategories()

  useEffect(() => {
    setPendingMaxPrice(filters.maxPrice)
  }, [filters.maxPrice])

  function commitMaxPrice(value: number) {
    const nextMaxPrice = Math.min(PRODUCT_PRICE_CEILING, Math.max(0, Math.round(value)))
    setPendingMaxPrice(nextMaxPrice)
    if (nextMaxPrice !== filters.maxPrice) {
      onChange({ ...filters, maxPrice: nextMaxPrice })
    }
  }

  const hasActiveFilters = Boolean(filters.categorySlug)
    || filters.maxPrice !== PRODUCT_PRICE_CEILING

  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onClear}
        disabled={!hasActiveFilters}
      >
        Clear filters
      </Button>

      <Accordion.Root type="multiple" defaultValue={['Category', 'Price']}>
        {!categoriesError && <FilterGroup title="Category">
          <ul className="space-y-2">
            <li>
              <button
                type="button"
                onClick={() => onChange({ ...filters, categorySlug: undefined })}
                className={cn(
                  'text-sm',
                  !filters.categorySlug
                    ? 'font-semibold text-oxblood'
                    : 'text-ink-soft hover:text-ink',
                )}
              >
                All Categories
              </button>
            </li>
            {categoriesLoading ? (
              Array.from({ length: 6 }, (_, index) => (
                <li key={index} className="flex items-center justify-between" aria-hidden="true">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-6" />
                </li>
              ))
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, categorySlug: category.slug })}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 text-left text-sm',
                      filters.categorySlug === category.slug
                        ? 'font-semibold text-oxblood'
                        : 'text-ink-soft hover:text-ink',
                    )}
                  >
                    <span>{category.name}</span>
                    <span className="shrink-0 text-xs text-ink-soft">({category.productCount})</span>
                  </button>
                </li>
              ))
            ) : categories.length === 0 ? (
              <li className="rounded-lg bg-tan/40 px-3 py-3 text-sm text-ink-soft" aria-live="polite">
                <p>No categories are available.</p>
              </li>
            ) : null}
          </ul>
        </FilterGroup>}

        <FilterGroup title="Price">
          <Slider.Root
            min={0}
            max={PRODUCT_PRICE_CEILING}
            step={1}
            value={[pendingMaxPrice]}
            onValueChange={([value]) => {
              if (value !== undefined) setPendingMaxPrice(value)
            }}
            onValueCommit={([value]) => {
              if (value !== undefined) commitMaxPrice(value)
            }}
            className="relative flex h-5 w-full touch-none select-none items-center"
          >
            <Slider.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-ink/15">
              <Slider.Range className="absolute h-full bg-oxblood" />
            </Slider.Track>
            <Slider.Thumb
              aria-label="Maximum price"
              className="block h-4 w-4 rounded-full border-2 border-oxblood bg-ivory shadow-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-oxblood/30"
            />
          </Slider.Root>
          <div className="mt-1 flex justify-between text-xs text-ink-soft">
            <span>₹0</span>
            <span>Up to ₹{pendingMaxPrice}</span>
          </div>
        </FilterGroup>
      </Accordion.Root>
    </div>
  )
}
