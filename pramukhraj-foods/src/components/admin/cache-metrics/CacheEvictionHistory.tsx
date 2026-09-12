import { ArchiveX } from 'lucide-react'
import type { CacheEvictionMetric } from '@/types/cacheMetrics'
import { formatCacheDate, formatNumber } from './cacheMetricsFormatters'

export function CacheEvictionHistory({ evictions }: { evictions: CacheEvictionMetric[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-card border border-ink/10 bg-ivory p-5" aria-labelledby="cache-evictions-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="cache-evictions-title" className="font-display text-lg">Recent Evictions</h2>
          <p className="text-xs text-ink-soft">Latest 100 removals, expirations, replacements and capacity evictions.</p>
        </div>
        <ArchiveX size={19} className="text-oxblood" aria-hidden />
      </div>
      {evictions.length > 0 ? (
        <div className="mt-4 max-h-80 max-w-full overflow-auto overscroll-contain">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="sticky top-0 bg-ivory text-[10px] uppercase tracking-wide text-ink-soft">
              <tr><th className="pb-2 font-medium">Key</th><th className="pb-2 font-medium">Reason</th><th className="pb-2 font-medium">Invalidation detail</th><th className="pb-2 font-medium">Size</th><th className="pb-2 font-medium">Time</th></tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {evictions.map((eviction, index) => (
                <tr key={`${eviction.evictedAtUtc}-${eviction.key}-${index}`}>
                  <td className="max-w-64 truncate py-2.5 pr-3 font-mono" title={eviction.key}>{eviction.key}</td>
                  <td className="py-2.5 pr-3"><span className="rounded-full bg-ink/5 px-2 py-1">{eviction.reason}</span></td>
                  <td className="max-w-56 truncate py-2.5 pr-3 text-ink-soft" title={eviction.manualInvalidationReason ?? undefined}>{eviction.manualInvalidationReason ?? '—'}</td>
                  <td className="py-2.5 pr-3">{formatNumber(eviction.size)}</td>
                  <td className="py-2.5 text-ink-soft">{formatCacheDate(eviction.evictedAtUtc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center text-sm text-ink-soft">No evictions recorded since server start.</div>
      )}
    </section>
  )
}
