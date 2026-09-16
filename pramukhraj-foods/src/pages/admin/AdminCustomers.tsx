import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, RefreshCw, ShieldAlert, Trash2, UserCheck, UserRound, UserX } from 'lucide-react'
import { CustomerDetailsDrawer } from '@/components/admin/customers/CustomerDetailsDrawer'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { useUrlPageParam } from '@/hooks/useUrlPageParam'
import { getApiErrorMessage } from '@/lib/apiClient'
import { formatDateTime } from '@/lib/utils'
import { adminCustomerApi } from '@/services/adminCustomerApi'
import type {
  AdminCustomerDetails,
  AdminCustomerFilterStatus,
  AdminCustomerListItem,
  AdminCustomerListPage,
  AdminCustomerStatus,
} from '@/types/adminCustomer'

const PAGE_SIZE = 20

function CustomerStatusBadge({ status }: { status: AdminCustomerStatus }) {
  if (status === 'ACTIVE') return <Badge variant="success">Active</Badge>
  if (status === 'BLOCKED') return <Badge variant="oxblood">Blocked</Badge>
  if (status === 'INACTIVE') return <Badge variant="outline">Inactive</Badge>
  return <Badge variant="soft">Deleted</Badge>
}

export function AdminCustomers() {
  const { page, setPage } = useUrlPageParam()
  const [data, setData] = useState<AdminCustomerListPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AdminCustomerFilterStatus>('ALL')
  const [sortBy, setSortBy] = useState<'createdOn' | 'updatedOn' | 'fullName' | 'lastLoginOn'>('createdOn')
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim()
      setSearch(currentSearch => {
        if (currentSearch !== nextSearch) setPage(1)
        return nextSearch
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput, setPage])

  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    setIsFetching(true)
    adminCustomerApi.getList({ pageNumber: page, pageSize: PAGE_SIZE, search, status, sortBy, sortDirection: 'desc' }, controller.signal)
      .then(result => {
        if (!result || controller.signal.aborted) return
        setData(result)
        if (page > result.totalPages) setPage(result.totalPages)
      })
      .catch(reason => { if (!controller.signal.aborted) setError(getApiErrorMessage(reason)) })
      .finally(() => { if (!controller.signal.aborted) { setIsLoading(false); setIsFetching(false) } })
    return () => controller.abort()
  }, [page, reloadKey, search, setPage, sortBy, status])

  const handleStatusChange = useCallback((nextStatus: AdminCustomerFilterStatus) => {
    setStatus(nextStatus)
    setPage(1)
  }, [setPage])

  const columns = useMemo<ColumnDef<AdminCustomerListItem, unknown>[]>(() => [
    {
      header: 'Customer', accessorKey: 'fullName',
      cell: ({ row }) => (
        <button type="button" onClick={() => setSelectedCustomerId(row.original.id)} className="flex items-center gap-3 text-left">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal/10 font-display text-sm! text-teal">
            {(row.original.fullName || row.original.mobileNumber).slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0"><span className="block max-w-52 truncate font-medium">{row.original.fullName || 'Profile incomplete'}</span><span className="block max-w-52 truncate text-xs! text-ink-soft">{row.original.email || row.original.mobileNumber}</span></span>
        </button>
      ),
    },
    { header: 'Mobile', accessorKey: 'mobileNumber', cell: ({ row }) => <span className="font-mono text-xs!">{row.original.mobileNumber}</span> },
    { header: 'Location', id: 'location', cell: ({ row }) => <span className="text-ink-soft">{[row.original.city, row.original.state].filter(Boolean).join(', ') || '—'}</span> },
    { header: 'Addresses', accessorKey: 'addressCount' },
    { header: 'Reviews', accessorKey: 'reviewCount' },
    {
      header: 'Verification', id: 'verification',
      cell: ({ row }) => <div className="flex flex-wrap gap-1"><Badge variant={row.original.isMobileVerified ? 'teal' : 'soft'}>Mobile</Badge><Badge variant={row.original.isEmailVerified ? 'teal' : 'soft'}>Email</Badge></div>,
    },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <CustomerStatusBadge status={row.original.status} /> },
    { header: 'Joined', accessorKey: 'createdOn', cell: ({ row }) => <time className="text-xs! text-ink-soft" dateTime={row.original.createdOn}>{formatDateTime(row.original.createdOn)}</time> },
    {
      header: '', id: 'actions', enableSorting: false,
      cell: ({ row }) => <button type="button" onClick={() => setSelectedCustomerId(row.original.id)} className="rounded-full p-2 text-ink-soft hover:bg-ink/5 hover:text-ink" aria-label={`View ${row.original.fullName}`}><Eye size={15} /></button>,
    },
  ], [])

  const summary = data?.summary

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="font-display text-2xl!">Customers</h1><p className="mt-1 text-sm! text-ink-soft">Manage customer profiles, verification, access and saved addresses.</p></div>
        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => setReloadKey(value => value + 1)}><RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh</Button>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryCard icon={UserRound} label="All customers" value={summary?.total ?? 0} tone="bg-teal/10 text-teal" />
        <SummaryCard icon={UserCheck} label="Active" value={summary?.active ?? 0} tone="bg-emerald-100 text-emerald-700" />
        <SummaryCard icon={ShieldAlert} label="Blocked" value={summary?.blocked ?? 0} tone="bg-oxblood/10 text-oxblood" />
        <SummaryCard icon={UserX} label="Inactive" value={summary?.inactive ?? 0} tone="bg-ink/5 text-ink-soft" />
        <SummaryCard icon={Trash2} label="Deleted" value={summary?.deleted ?? 0} tone="bg-ink/5 text-ink-soft" />
      </section>

      {error && !data ? <ServerError className="h-auto min-h-96 py-16" message={error} action={{ label: 'Retry', onClick: () => setReloadKey(value => value + 1) }} /> : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          searchPlaceholder="Search name, email or mobile..."
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          loadingRows={10}
          emptyMessage="No customers match these filters."
          toolbar={<div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <select value={status} onChange={event => handleStatusChange(event.target.value as AdminCustomerFilterStatus)} className="h-9 flex-1 rounded-full border border-ink/15 bg-ivory px-3 text-xs! outline-none sm:flex-none">
              <option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="BLOCKED">Blocked</option><option value="INACTIVE">Inactive</option><option value="DELETED">Deleted</option>
            </select>
            <select value={sortBy} onChange={event => { setSortBy(event.target.value as typeof sortBy); setPage(1) }} className="h-9 flex-1 rounded-full border border-ink/15 bg-ivory px-3 text-xs! outline-none sm:flex-none">
              <option value="createdOn">Newest joined</option><option value="updatedOn">Recently updated</option><option value="lastLoginOn">Recent login</option><option value="fullName">Name Z–A</option>
            </select>
          </div>}
          serverPagination={{
            page,
            hasPreviousPage: page > 1,
            hasNextPage: page < (data?.totalPages ?? 1),
            isFetching,
            onPageChange: nextPage => { setPage(nextPage); window.scrollTo({ top: 0, behavior: 'smooth' }) },
          }}
        />
      )}

      {error && data && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm! text-red-800">{error}</div>}

      <CustomerDetailsDrawer
        customerId={selectedCustomerId}
        open={selectedCustomerId !== null}
        onOpenChange={open => { if (!open) setSelectedCustomerId(null) }}
        onUpdated={(_customer: AdminCustomerDetails) => setReloadKey(value => value + 1)}
      />
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: typeof UserRound; label: string; value: number; tone: string }) {
  return <article className="rounded-card border border-ink/10 bg-ivory p-4"><span className={`flex h-9 w-9 items-center justify-center rounded-full ${tone}`}><Icon size={17} /></span><p className="mt-3 font-display text-2xl!">{value}</p><p className="text-xs! text-ink-soft">{label}</p></article>
}
