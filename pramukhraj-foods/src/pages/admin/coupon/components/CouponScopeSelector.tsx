import { useMemo, useState } from 'react'
import { Check, LoaderCircle, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { ComboData } from '@/types/common'

interface CouponScopeSelectorProps {
  label: string
  items: ComboData[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function CouponScopeSelector({
  label, items, selectedIds, onChange, loading, error, onRetry,
}: CouponScopeSelectorProps) {
  const [search, setSearch] = useState('')
  const selected = useMemo(() => new Set(selectedIds), [selectedIds])
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return term ? items.filter(item => item.name.toLowerCase().includes(term)) : items
  }, [items, search])

  function toggle(id: string) {
    onChange(selected.has(id) ? selectedIds.filter(value => value !== id) : [...new Set([...selectedIds, id])])
  }

  return (
    <fieldset className="rounded-lg border border-ink/10 bg-ivory-dim p-3">
      <legend className="px-1 text-xs font-medium text-ink-soft">{label}</legend>
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-ink/15 bg-ivory px-3 py-2">
        <Search size={14} className="text-ink-soft" aria-hidden />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={`Search ${label.toLowerCase()}...`}
          className="w-full bg-transparent text-sm outline-none"
          aria-label={`Search ${label.toLowerCase()}`}
        />
      </div>

      {loading ? (
        <div className="flex h-28 items-center justify-center gap-2 text-sm text-ink-soft"><LoaderCircle size={16} className="animate-spin" /> Loading...</div>
      ) : error ? (
        <div className="flex h-28 flex-col items-center justify-center gap-2 text-center text-xs text-oxblood">
          <span>{error}</span>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}><RefreshCw size={13} /> Retry</Button>
        </div>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1" role="listbox" aria-multiselectable="true">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-ink-soft">No matching options.</p>
          ) : filtered.map(item => (
            <button
              type="button"
              key={item.id}
              onClick={() => toggle(item.id)}
              role="option"
              aria-selected={selected.has(item.id)}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-oxblood/40"
            >
              <span className="truncate">{item.name}</span>
              <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected.has(item.id) ? 'border-oxblood bg-oxblood text-ivory' : 'border-ink/20'}`}>
                {selected.has(item.id) && <Check size={11} aria-hidden />}
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] text-ink-soft">{selectedIds.length} selected</p>
    </fieldset>
  )
}
