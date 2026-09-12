import { useCallback, useState } from 'react'
import { AlertCircle, ArchiveX, Database, Gauge, LoaderCircle, MousePointerClick, RefreshCw, Timer, Trash2, TrendingUp } from 'lucide-react'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { CacheEntriesTable } from '@/components/admin/cache-metrics/CacheEntriesTable'
import { CacheEvictionHistory } from '@/components/admin/cache-metrics/CacheEvictionHistory'
import { CacheExpirationInsights } from '@/components/admin/cache-metrics/CacheExpirationInsights'
import { CacheMetricCard } from '@/components/admin/cache-metrics/CacheMetricCard'
import { CacheOverviewCharts } from '@/components/admin/cache-metrics/CacheOverviewCharts'
import { formatCacheDate, formatNumber } from '@/components/admin/cache-metrics/cacheMetricsFormatters'
import { Button } from '@/components/ui/Button'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCacheMetrics } from '@/hooks/cache-metrics/useCacheMetrics'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage } from '@/lib/apiClient'

type ClearTarget =
  | { scope: 'all' }
  | { scope: 'module'; module: string }
  | { scope: 'key'; key: string }

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading cache metrics">
      <div className="flex justify-between"><div><Skeleton className="h-8 w-56" /><Skeleton className="mt-2 h-4 w-80" /></div><Skeleton className="h-10 w-28 rounded-full" /></div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-36 rounded-card" />)}</div>
      <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-96 rounded-card" /><Skeleton className="h-96 rounded-card" /></div>
      <Skeleton className="h-96 rounded-card" />
    </div>
  )
}

export function AdminCacheMetrics() {
  const { metrics, isLoading, isRefreshing, error, mutationTarget, refresh, clearAll, clearKey, clearModule } = useCacheMetrics()
  const [clearTarget, setClearTarget] = useState<ClearTarget | null>(null)
  const dialog = useMessageDialog()
  const requestClearKey = useCallback((key: string) => setClearTarget({ scope: 'key', key }), [])
  const requestClearModule = useCallback((module: string) => setClearTarget({ scope: 'module', module }), [])

  async function confirmClear() {
    const target = clearTarget
    if (!target) return

    try {
      const result = target.scope === 'all'
        ? await clearAll()
        : target.scope === 'module'
          ? await clearModule(target.module)
          : await clearKey(target.key)
      const count = result?.invalidatedEntries ?? 0
      dialog.success(
        `${count} cache ${count === 1 ? 'entry was' : 'entries were'} cleared successfully.`,
        { title: 'Cache Cleared' },
      )
    } catch (clearError) {
      dialog.error(getApiErrorMessage(clearError), { title: 'Could Not Clear Cache' })
    }
  }

  const confirmation = clearTarget?.scope === 'all'
    ? {
        title: 'Clear the entire cache?',
        description: `All ${metrics?.totalCachedEntries ?? 0} active cache entries will be removed. Customer and admin requests may be slower while data is rebuilt.`,
        label: 'Clear all cache',
      }
    : clearTarget?.scope === 'module'
      ? {
          title: `Clear ${clearTarget.module} cache?`,
          description: 'Every active entry in this module will be removed and rebuilt when next requested.',
          label: 'Clear module',
        }
      : {
          title: 'Clear this cache key?',
          description: clearTarget?.key ?? '',
          label: 'Clear key',
        }

  if (isLoading && !metrics) return <DashboardSkeleton />

  if (!metrics) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center rounded-card border border-dashed border-oxblood/25 bg-ivory px-6 text-center">
        <AlertCircle size={28} className="text-oxblood" />
        <h1 className="mt-4 font-display text-xl">Unable to Load Cache Metrics</h1>
        <p className="mt-2 max-w-md text-sm text-ink-soft">{error ?? 'The metrics endpoint returned no data.'}</p>
        <Button type="button" className="mt-5" onClick={() => void refresh()}><RefreshCw size={15} /> Try Again</Button>
      </div>
    )
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl">Cache Metrics</h1>
          <p className="text-sm text-ink-soft">Live in-memory cache health, efficiency, expiration and eviction telemetry.</p>
          <p className="mt-1 text-[11px] text-ink-soft">Updated {formatCacheDate(metrics.generatedAtUtc)} · automatically refreshes every 30 seconds</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={isRefreshing || mutationTarget !== null} onClick={() => void refresh()}>
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh now'}
          </Button>
          <Button
            type="button"
            disabled={metrics.totalCachedEntries === 0 || mutationTarget !== null}
            onClick={() => setClearTarget({ scope: 'all' })}
            className="bg-oxblood text-ivory hover:bg-oxblood-deep"
          >
            {mutationTarget === 'all' ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Clear all cache
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-card border border-turmeric/40 bg-turmeric/10 px-4 py-3 text-sm text-turmeric-deep" role="status">
          <AlertCircle size={16} /> Latest refresh failed: {error}. Showing the last successful snapshot.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <CacheMetricCard label="Active entries" value={formatNumber(metrics.totalCachedEntries)} detail={`${metrics.entriesNearingExpiration} nearing expiration`} icon={Database} />
        <CacheMetricCard label="Allocated size" value={`${formatNumber(metrics.currentEstimatedCacheSize)} units`} detail={`${metrics.cacheMemoryPercentage.toFixed(2)}% of ${formatNumber(metrics.cacheSizeLimit)} configured units`} icon={Gauge} tone="turmeric" />
        <CacheMetricCard label="Hit ratio" value={`${metrics.hitRatioPercentage.toFixed(2)}%`} detail={`${formatNumber(metrics.totalCacheHits + metrics.totalCacheMisses)} tracked lookups`} icon={TrendingUp} tone="teal" />
        <CacheMetricCard label="Cache hits" value={formatNumber(metrics.totalCacheHits)} detail="Requests served from memory" icon={MousePointerClick} tone="teal" />
        <CacheMetricCard label="Cache misses" value={formatNumber(metrics.totalCacheMisses)} detail="Requests requiring source lookup" icon={Timer} tone="turmeric" />
        <CacheMetricCard label="Evictions" value={formatNumber(metrics.evictionCount)} detail={metrics.lastEvictionAtUtc ? `Last: ${formatCacheDate(metrics.lastEvictionAtUtc)}` : 'No evictions since server start'} icon={ArchiveX} />
      </div>

      <section className="rounded-card border border-ink/10 bg-ivory p-5" aria-labelledby="cache-capacity-title">
        <div className="flex items-end justify-between gap-4">
          <div><h2 id="cache-capacity-title" className="font-display text-lg">Cache Capacity</h2><p className="text-xs text-ink-soft">Size is an application-assigned unit, not a byte measurement.</p></div>
          <span className="text-sm font-semibold">{metrics.cacheMemoryPercentage.toFixed(2)}%</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-ink/5" role="progressbar" aria-valuenow={metrics.cacheMemoryPercentage} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-r from-teal via-turmeric to-oxblood transition-[width]" style={{ width: `${Math.min(metrics.cacheMemoryPercentage, 100)}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-ink-soft"><span>{formatNumber(metrics.currentEstimatedCacheSize)} used</span><span>{formatNumber(Math.max(metrics.cacheSizeLimit - metrics.currentEstimatedCacheSize, 0))} available</span></div>
      </section>

      <CacheOverviewCharts metrics={metrics} onClearModule={requestClearModule} mutationTarget={mutationTarget} />
      <div className="grid min-w-0 gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <CacheExpirationInsights entries={metrics.expiringNext} />
        <CacheEvictionHistory evictions={metrics.recentEvictions} />
      </div>
      <CacheEntriesTable entries={metrics.entries} onClearKey={requestClearKey} mutationTarget={mutationTarget} />

      <p className="rounded-lg bg-ink/[0.035] px-4 py-3 text-[11px] text-ink-soft">
        Metrics are process-local and reset when the API restarts. This dashboard never returns cached values or payload contents.
      </p>

      <ConfirmDialog
        open={clearTarget !== null}
        onOpenChange={open => !open && setClearTarget(null)}
        title={confirmation.title}
        description={confirmation.description}
        confirmLabel={confirmation.label}
        onConfirm={() => void confirmClear()}
      />
      <MessageDialog {...dialog.props} />
    </div>
  )
}
