import type { ReactNode } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check, ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { PRODUCT_PRICE_CEILING } from '@/constants/productListing'
import { useCustomerCategories } from '@/hooks/useCustomerCategoriesContext'
import { cn } from '@/lib/utils'
import { brands } from '@/mock'
import type { ProductListingFilters } from '@/types/productListing'

interface ProductFilterSidebarProps {
  filters: ProductListingFilters
  onChange: (filters: ProductListingFilters) => void
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

export function ProductFilterSidebar({ filters, onChange }: ProductFilterSidebarProps) {
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    retry: retryCategories,
  } = useCustomerCategories()

  return (
    <Accordion.Root
      type="multiple"
      defaultValue={['Category', 'Price', 'Brand', 'Rating']}
      className="w-full"
    >
      <FilterGroup title="Category">
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
          ) : (
            <li className="rounded-lg bg-tan/40 px-3 py-3 text-sm text-ink-soft" aria-live="polite">
              <p>{categoriesError ? 'Unable to load categories.' : 'No categories are available.'}</p>
              {categoriesError && (
                <button
                  type="button"
                  onClick={() => void retryCategories()}
                  className="mt-2 font-medium text-oxblood hover:underline"
                >
                  Try again
                </button>
              )}
            </li>
          )}
        </ul>
      </FilterGroup>

      <FilterGroup title="Price">
        <input
          aria-label="Maximum price"
          type="range"
          min={0}
          max={PRODUCT_PRICE_CEILING}
          value={filters.maxPrice}
          onChange={(event) => onChange({ ...filters, maxPrice: Number(event.target.value) })}
          className="w-full accent-oxblood"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-soft">
          <span>₹0</span>
          <span>Up to ₹{filters.maxPrice}</span>
        </div>
      </FilterGroup>

      <FilterGroup title="Brand">
        <ul className="space-y-2.5">
          {brands.map((brand) => {
            const checked = filters.brandSlugs.includes(brand.slug)
            const checkboxId = `brand-${brand.id}`
            return (
              <li key={brand.id} className="flex items-center gap-2">
                <Checkbox.Root
                  id={checkboxId}
                  checked={checked}
                  onCheckedChange={(value) => onChange({
                    ...filters,
                    brandSlugs: value
                      ? [...filters.brandSlugs, brand.slug]
                      : filters.brandSlugs.filter((slug) => slug !== brand.slug),
                  })}
                  className="flex h-4 w-4 items-center justify-center rounded border border-ink/30 data-[state=checked]:border-oxblood data-[state=checked]:bg-oxblood"
                >
                  <Checkbox.Indicator><Check size={11} className="text-ivory" /></Checkbox.Indicator>
                </Checkbox.Root>
                <label htmlFor={checkboxId} className="cursor-pointer text-sm text-ink-soft">{brand.name}</label>
              </li>
            )
          })}
        </ul>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className="flex flex-col gap-2">
          {[4, 3, 2].map((rating) => (
            <button
              type="button"
              key={rating}
              onClick={() => onChange({
                ...filters,
                minRating: filters.minRating === rating ? undefined : rating,
              })}
              className={cn(
                'flex items-center gap-1 text-sm',
                filters.minRating === rating
                  ? 'font-semibold text-oxblood'
                  : 'text-ink-soft hover:text-ink',
              )}
            >
              {rating}★ &amp; above
            </button>
          ))}
        </div>
      </FilterGroup>
    </Accordion.Root>
  )
}
