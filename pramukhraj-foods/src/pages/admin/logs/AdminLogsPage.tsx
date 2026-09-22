import { useEffect, useRef } from 'react'
import {
  AlertCircle,
  Calendar,
  CreditCard,
  Download,
  Filter,
  Layers,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Terminal,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ClearLogsModal } from '@/features/logs/components/ClearLogsModal'
import { LogEntryItem } from '@/features/logs/components/LogEntryItem'
import { useAdminLogs } from '@/features/logs/hooks/useAdminLogs'
import { adminLogsApi } from '@/features/logs/api/logs.api'
import type { LogLevelFilter, LogSubModule } from '@/features/logs/types/logs.types'
import { cn } from '@/lib/utils'

export function AdminLogsPage() {
  const {
    subModule,
    setSubModule,
    date,
    setDate,
    level,
    setLevel,
    search,
    setSearch,
    entries,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    isRefreshing,
    error,
    autoRefresh,
    setAutoRefresh,
    isClearModalOpen,
    setIsClearModalOpen,
    isClearing,
    handleClearLogs,
    loadMore,
    refresh,
    availableDates,
    activeFileInfo,
  } = useAdminLogs()

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      entriesList => {
        const [entry] = entriesList
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isInitialLoading) {
          void loadMore()
        }
      },
      { root: null, rootMargin: '300px', threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, isInitialLoading, loadMore])

  const subModuleTabs: { id: LogSubModule; label: string; icon: typeof Layers }[] = [
    { id: 'all', label: 'All Logs', icon: Layers },
    { id: 'payment', label: 'Payment Logs', icon: CreditCard },
    { id: 'email', label: 'Email Logs', icon: Mail },
    { id: 'shipment', label: 'Shipment Logs', icon: Truck },
  ]

  const levelOptions: { id: LogLevelFilter; label: string; dot: string }[] = [
    { id: 'all', label: 'All Levels', dot: 'bg-ink/30' },
    { id: 'error', label: 'Errors Only', dot: 'bg-red-500' },
    { id: 'warning', label: 'Warnings', dot: 'bg-amber-500' },
    { id: 'info', label: 'Information', dot: 'bg-sky-500' },
    { id: 'success', label: 'Successes', dot: 'bg-emerald-500' },
  ]

  const downloadUrl = adminLogsApi.getDownloadUrl(date)

  return (
    <div className="min-w-0 space-y-6">
      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-oxblood/10 text-oxblood">
              <Terminal size={18} />
            </span>
            <div>
              <h1 className="font-display text-2xl text-ink">System Logs</h1>
              <p className="text-sm text-ink-soft">
                Live structured diagnostic logs streamed from server files.
              </p>
            </div>
          </div>

          {activeFileInfo && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-soft">
              <span className="inline-flex items-center gap-1 font-mono font-medium text-ink">
                <Calendar size={12} /> {activeFileInfo.date}
              </span>
              <span>•</span>
              <span>File: {activeFileInfo.fileName}</span>
              <span>•</span>
              <span className="rounded bg-ink/5 px-1.5 py-0.5 font-mono">
                {activeFileInfo.formattedSize}
              </span>
              {activeFileInfo.isActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                  Active Today
                </span>
              )}
            </div>
          )}
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Auto-Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
              autoRefresh
                ? 'border-green-300 bg-green-50 text-green-800'
                : 'border-ink/15 bg-ivory text-ink-soft hover:bg-ink/5 hover:text-ink'
            )}
            title={autoRefresh ? 'Live auto-refresh enabled (5s)' : 'Click to enable live stream'}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                autoRefresh ? 'animate-ping bg-green-500' : 'bg-ink/30'
              )}
            />
            <span>{autoRefresh ? 'Live Streaming' : 'Live Stream Off'}</span>
          </button>

          {/* Refresh Now */}
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing || isInitialLoading}
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Download Raw File */}
          <a
            href={downloadUrl}
            download
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink/15 bg-ivory px-3 text-xs font-medium text-ink hover:bg-ink/5 transition-colors"
            title="Download full raw log file"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* Clear Logs Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsClearModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-ivory inline-flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span>Clear Logs</span>
          </Button>
        </div>
      </header>

      {/* ─── Error Alert ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between rounded-card border border-oxblood/30 bg-oxblood/5 p-4 text-sm text-oxblood">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Retry
          </Button>
        </div>
      )}

      {/* ─── Sub-Module Navigation Tabs ───────────────────────────────────────── */}
      <div className="flex overflow-x-auto border-b border-ink/10 pb-px">
        <nav className="flex gap-2" aria-label="Logs Sub-modules">
          {subModuleTabs.map(tab => {
            const Icon = tab.icon
            const isActive = subModule === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubModule(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm',
                  isActive
                    ? 'border-oxblood bg-ivory text-oxblood shadow-xs'
                    : 'border-transparent text-ink-soft hover:border-ink/20 hover:text-ink'
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* ─── Filter Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-card border border-ink/10 bg-ivory p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Level Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-ink-soft" />
            <select
              value={level}
              onChange={e => setLevel(e.target.value as LogLevelFilter)}
              className="h-9 rounded-lg border border-ink/15 bg-ivory px-3 text-xs font-medium text-ink focus:border-oxblood focus:outline-hidden"
            >
              {levelOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker / File Selector */}
          {availableDates.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-ink-soft" />
              <select
                value={date}
                onChange={e => setDate(e.target.value)}
                className="h-9 rounded-lg border border-ink/15 bg-ivory px-3 text-xs font-medium text-ink focus:border-oxblood focus:outline-hidden"
              >
                {availableDates.map(f => (
                  <option key={f.date} value={f.date}>
                    {f.date} ({f.formattedSize})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Filters */}
          {(level !== 'all' || search) && (
            <button
              type="button"
              onClick={() => {
                setLevel('all')
                setSearch('')
              }}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-dashed border-ink/20 px-2.5 text-xs text-ink-soft hover:border-ink/40 hover:text-ink"
            >
              <X size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search
            size={14}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search message, context..."
            className="h-9 w-full rounded-lg border border-ink/15 bg-ivory pr-8 pl-8 text-xs text-ink placeholder:text-ink-soft/70 focus:border-oxblood focus:outline-hidden"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-soft hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Log Stream Container ─────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-card border border-ink/10 bg-ivory shadow-xs">
        {/* Stream Stats Header */}
        <div className="flex items-center justify-between border-b border-ink/10 bg-ink/[0.02] px-4 py-2 text-[11px] text-ink-soft">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">
              Showing {entries.length} log {entries.length === 1 ? 'entry' : 'entries'}
            </span>
            <span>(Newest first)</span>
          </div>
          {hasMore && (
            <span className="text-oxblood font-medium">
              Scroll down to stream older entries
            </span>
          )}
        </div>

        {/* Log Entries List */}
        {isInitialLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2 border-b border-ink/5 pb-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink-soft">
              <Terminal size={24} />
            </span>
            <h2 className="mt-4 font-display text-lg text-ink">No log entries found</h2>
            <p className="mt-1 max-w-sm text-xs text-ink-soft">
              {search || level !== 'all' || subModule !== 'all'
                ? 'No log entries matched your current filters. Try changing your search keywords or switching to All Levels.'
                : 'The log file for this date is empty or has been cleared.'}
            </p>
            {(search || level !== 'all' || subModule !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSubModule('all')
                  setLevel('all')
                  setSearch('')
                }}
              >
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-ink/10 font-mono text-xs">
            {entries.map(entry => (
              <LogEntryItem
                key={entry.id}
                entry={entry}
                searchKeyword={search}
              />
            ))}
          </div>
        )}

        {/* Infinite Scroll Sentinel & Load More Indicator */}
        <div ref={sentinelRef} className="p-4 text-center">
          {isLoadingMore && (
            <div className="inline-flex items-center gap-2 text-xs font-mono text-ink-soft">
              <Loader2 size={14} className="animate-spin text-oxblood" />
              <span>Streaming older chunk from disk...</span>
            </div>
          )}

          {!hasMore && entries.length > 0 && !isInitialLoading && (
            <p className="text-[11px] font-mono text-ink-soft/70">
              ✓ Reached start of file for this date ({entries.length} matching entries)
            </p>
          )}
        </div>
      </section>

      {/* ─── Clear Logs Confirmation Modal ────────────────────────────────────── */}
      <ClearLogsModal
        open={isClearModalOpen}
        onOpenChange={setIsClearModalOpen}
        targetDate={date}
        fileName={activeFileInfo?.fileName}
        formattedSize={activeFileInfo?.formattedSize}
        isClearing={isClearing}
        onConfirm={handleClearLogs}
      />
    </div>
  )
}
