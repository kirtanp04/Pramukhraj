import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { LoaderCircle, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { cn } from '@/lib/utils'
import type { CacheEntryMetric } from '@/types/cacheMetrics'
import { formatCacheDate, formatNumber, formatTtl } from './cacheMetricsFormatters'

export function CacheEntriesTable({
  entries,
  onClearKey,
  mutationTarget,
}: {
  entries: CacheEntryMetric[]
  onClearKey: (key: string) => void
  mutationTarget: string | null
}) {
  const columns = useMemo<ColumnDef<CacheEntryMetric>[]>(() => [
    {
      accessorKey: 'key',
      header: 'Cache key',
      cell: ({ row }) => (
        <div className="max-w-72">
          <p className="truncate font-mono text-xs font-medium" title={row.original.key}>{row.original.key}</p>
          <p className="mt-0.5 text-[11px] text-ink-soft">{row.original.group}</p>
        </div>
      ),
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ getValue }) => `${formatNumber(Number(getValue()))} units`,
    },
    {
      accessorKey: 'createdAtUtc',
      header: 'Created',
      cell: ({ getValue }) => <span className="text-xs">{formatCacheDate(String(getValue()))}</span>,
    },
    {
      accessorKey: 'absoluteExpirationAtUtc',
      header: 'Absolute expiry',
      cell: ({ row }) => <span className="text-xs">{formatCacheDate(row.original.absoluteExpirationAtUtc)}</span>,
    },
    {
      accessorKey: 'remainingTtlSeconds',
      header: 'Remaining TTL',
      cell: ({ row }) => (
        <span className={cn(
          'rounded-full px-2 py-1 text-[11px] font-medium',
          row.original.isNearingExpiration ? 'bg-oxblood/10 text-oxblood' : 'bg-teal/10 text-teal',
        )}>
          {formatTtl(row.original.remainingTtlSeconds)}
        </span>
      ),
    },
    {
      accessorKey: 'slidingExpirationSeconds',
      header: 'Sliding expiry',
      cell: ({ row }) => formatTtl(row.original.slidingExpirationSeconds),
    },
    {
      accessorKey: 'lastAccessedAtUtc',
      header: 'Last accessed',
      cell: ({ row }) => <span className="text-xs">{formatCacheDate(row.original.lastAccessedAtUtc)}</span>,
    },
    { accessorKey: 'hits', header: 'Hits', cell: ({ getValue }) => formatNumber(Number(getValue())) },
    { accessorKey: 'misses', header: 'Misses', cell: ({ getValue }) => formatNumber(Number(getValue())) },
    {
      accessorKey: 'dataType',
      header: 'Data type',
      cell: ({ getValue }) => <span className="max-w-56 truncate font-mono text-xs" title={String(getValue())}>{String(getValue())}</span>,
    },
    { accessorKey: 'priority', header: 'Priority' },
    {
      id: 'actions',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => {
        const isClearing = mutationTarget === `key:${row.original.key}`
        return (
          <button
            type="button"
            disabled={mutationTarget !== null}
            onClick={() => onClearKey(row.original.key)}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-oxblood hover:bg-oxblood/5 disabled:opacity-40"
            aria-label={`Clear cache key ${row.original.key}`}
          >
            {isClearing ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Clear
          </button>
        )
      },
    },
  ], [mutationTarget, onClearKey])

  return (
    <section className="min-w-0 max-w-full" aria-labelledby="cache-entries-title">
      <div className="mb-3">
        <h2 id="cache-entries-title" className="font-display text-lg">Current Cache Entries</h2>
        <p className="text-xs text-ink-soft">Live key metadata and custom access counters. Values are never exposed.</p>
      </div>
      <DataTable
        columns={columns}
        data={entries}
        searchPlaceholder="Search cache keys, groups or data types..."
        pageSize={8}
        initialSorting={[{ id: 'createdAtUtc', desc: true }]}
        emptyMessage="No cache entries are currently active."
      />
    </section>
  )
}
