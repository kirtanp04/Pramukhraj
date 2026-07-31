import * as Accordion from '@radix-ui/react-accordion'
import * as Checkbox from '@radix-ui/react-checkbox'
import { ChevronDown, Check } from 'lucide-react'
import { categories, brands } from '@/mock'
import { cn } from '@/lib/utils'

export interface Filters {
  categorySlug?: string
  brandSlugs: string[]
  maxPrice: number
  minRating?: number
}

const PRICE_CEILING = 900

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
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

export function FilterSidebar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  return (
    <Accordion.Root type="multiple" defaultValue={['Category', 'Price', 'Brand', 'Rating']} className="w-full">
      <FilterGroup title="Category">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onChange({ ...filters, categorySlug: undefined })}
              className={cn('text-sm', !filters.categorySlug ? 'font-semibold text-oxblood' : 'text-ink-soft hover:text-ink')}
            >
              All Categories
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onChange({ ...filters, categorySlug: c.slug })}
                className={cn('text-sm', filters.categorySlug === c.slug ? 'font-semibold text-oxblood' : 'text-ink-soft hover:text-ink')}
              >
                {c.name} <span className="text-xs">({c.productCount})</span>
              </button>
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Price">
        <input
          type="range"
          min={0}
          max={PRICE_CEILING}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-oxblood"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-soft">
          <span>₹0</span>
          <span>Up to ₹{filters.maxPrice}</span>
        </div>
      </FilterGroup>

      <FilterGroup title="Brand">
        <ul className="space-y-2.5">
          {brands.map((b) => {
            const checked = filters.brandSlugs.includes(b.slug)
            return (
              <li key={b.id} className="flex items-center gap-2">
                <Checkbox.Root
                  checked={checked}
                  onCheckedChange={(v) =>
                    onChange({
                      ...filters,
                      brandSlugs: v ? [...filters.brandSlugs, b.slug] : filters.brandSlugs.filter((s) => s !== b.slug),
                    })
                  }
                  className="flex h-4 w-4 items-center justify-center rounded border border-ink/30 data-[state=checked]:bg-oxblood data-[state=checked]:border-oxblood"
                >
                  <Checkbox.Indicator><Check size={11} className="text-ivory" /></Checkbox.Indicator>
                </Checkbox.Root>
                <label className="text-sm text-ink-soft">{b.name}</label>
              </li>
            )
          })}
        </ul>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className="flex flex-col gap-2">
          {[4, 3, 2].map((r) => (
            <button
              key={r}
              onClick={() => onChange({ ...filters, minRating: filters.minRating === r ? undefined : r })}
              className={cn(
                'flex items-center gap-1 text-sm',
                filters.minRating === r ? 'font-semibold text-oxblood' : 'text-ink-soft hover:text-ink',
              )}
            >
              {r}★ &amp; above
            </button>
          ))}
        </div>
      </FilterGroup>
    </Accordion.Root>
  )
}
