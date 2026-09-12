import { Clock3, TimerReset } from 'lucide-react'
import type { CacheEntryMetric } from '@/types/cacheMetrics'
import { formatTtl } from './cacheMetricsFormatters'

export function CacheExpirationInsights({ entries }: { entries: CacheEntryMetric[] }) {
  const maxTtl = Math.max(...entries.map(entry => entry.remainingTtlSeconds ?? 0), 1)

  return (
    <section className="rounded-card border border-ink/10 bg-ivory p-5" aria-labelledby="cache-expiration-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="cache-expiration-title" className="font-display text-lg">Expiring Next</h2>
          <p className="text-xs text-ink-soft">The next five keys ordered by absolute expiration.</p>
        </div>
        <Clock3 size={19} className="text-oxblood" aria-hidden />
      </div>
      {entries.length > 0 ? (
        <div className="mt-5 space-y-4">
          {entries.map(entry => {
            const percentage = Math.max(4, ((entry.remainingTtlSeconds ?? 0) / maxTtl) * 100)
            return (
              <div key={entry.key}>
                <div className="mb-1.5 flex items-center justify-between gap-4 text-xs">
                  <span className="min-w-0 truncate font-mono" title={entry.key}>{entry.key}</span>
                  <span className={entry.isNearingExpiration ? 'font-semibold text-oxblood' : 'text-ink-soft'}>
                    {formatTtl(entry.remainingTtlSeconds)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink/5">
                  <div
                    className={entry.isNearingExpiration ? 'h-full rounded-full bg-oxblood' : 'h-full rounded-full bg-turmeric'}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex h-48 flex-col items-center justify-center text-sm text-ink-soft">
          <TimerReset size={24} className="mb-2 opacity-50" />
          No expiring keys are currently tracked.
        </div>
      )}
    </section>
  )
}
