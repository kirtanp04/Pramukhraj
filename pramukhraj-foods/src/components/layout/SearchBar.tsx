import { useMemo, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { products } from '@/mock'
import { formatINR, cn } from '@/lib/utils'

const popularSearches = ['Khakhra', 'Kaju Katli', 'Masala Papad', 'Dry Fruit Gift Box', 'Filter Coffee']

export function SearchBar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6)
  }, [query])

  function submit(term: string) {
    navigate(`/products?search=${encodeURIComponent(term)}`)
    setFocused(false)
    setQuery('')
    onNavigate?.()
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-ivory px-4 py-2 focus-within:border-oxblood/50 transition-colors">
        <Search size={16} className="shrink-0 text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => e.key === 'Enter' && query.trim() && submit(query)}
          placeholder="Search for papad, khakhra, pickles..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/70"
        />
        {query && (
          <button aria-label="Clear search" onClick={() => setQuery('')}>
            <X size={14} className="text-ink-soft" />
          </button>
        )}
      </div>

      {focused && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-auto rounded-xl border border-ink/10 bg-ivory shadow-xl">
          {suggestions.length > 0 ? (
            <ul className="divide-y divide-ink/5">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/product/${p.slug}`}
                    onClick={() => { setFocused(false); setQuery(''); onNavigate?.() }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-tan/50"
                  >
                    <img src={p.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{p.name}</p>
                      <p className="text-xs text-ink-soft">{p.category.name}</p>
                    </div>
                    <span className="font-mono text-xs">{formatINR(p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <div className="p-4 text-center text-sm text-ink-soft">No matches — try a different term.</div>
          ) : (
            <div className="p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Trending searches</p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-full bg-tan px-3 py-1 text-xs hover:bg-tan-deep"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
