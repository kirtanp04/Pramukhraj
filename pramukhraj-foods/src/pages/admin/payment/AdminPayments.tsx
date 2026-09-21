import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Eye,
  ExternalLink,
  RefreshCw,
  Search,
  Copy,
  Check,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  X,
} from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { useUrlPageParam } from '@/hooks/useUrlPageParam'
import { formatDateTime, formatINR } from '@/lib/utils'
import { useAdminPayments } from '@/hooks/useAdminPayments'
import { AdminPaymentDrawer } from './AdminPaymentDrawer'
import type {
  AdminPaymentListItem,
  AdminPaymentStatus,
} from '@/types/adminPayment'

const PAGE_SIZE = 20

function PaymentStatusBadge({ status }: { status: AdminPaymentStatus | string }) {
  switch (status) {
    case 'Paid':
      return <Badge variant="teal">Paid</Badge>
    case 'Pending':
    case 'ProviderOrderCreated':
      return <Badge variant="turmeric">Pending</Badge>
    case 'Failed':
    case 'VerificationFailed':
      return <Badge variant="oxblood">Failed</Badge>
    case 'Expired':
      return <Badge variant="soft">Expired</Badge>
    default:
      return <Badge variant="soft">{status}</Badge>
  }
}

export function AdminPayments() {
  const navigate = useNavigate()
  const { page, setPage } = useUrlPageParam()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, setPage])

  const {
    payments,
    totalPages,
    summary,
    isInitialLoading,
    isFetching,
    error,
    reload,
  } = useAdminPayments({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    status: statusFilter,
    onPageChange: setPage,
  })

  const copyToClipboard = useCallback((text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const columns = useMemo<ColumnDef<AdminPaymentListItem, any>[]>(() => [
    {
      header: 'Payment / Gateway ID',
      accessorKey: 'id',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 font-mono text-xs! font-medium text-ink">
              <span>{item.providerPaymentId || item.id.slice(0, 8)}</span>
              {item.providerPaymentId && (
                <button
                  type="button"
                  onClick={(e) => copyToClipboard(item.providerPaymentId!, `prov-${item.id}`, e)}
                  className="text-ink-soft hover:text-ink transition-colors p-0.5 rounded"
                  title="Copy Razorpay Payment ID"
                >
                  {copiedId === `prov-${item.id}` ? (
                    <Check size={12} className="text-teal" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              )}
            </div>
            <div className="font-mono text-[11px]! text-ink-soft flex items-center gap-1">
              <span>ID: {item.id.slice(0, 13)}…</span>
              <button
                type="button"
                onClick={(e) => copyToClipboard(item.id, `id-${item.id}`, e)}
                className="text-ink-soft hover:text-ink transition-colors p-0.5 rounded"
                title="Copy Payment ID"
              >
                {copiedId === `id-${item.id}` ? (
                  <Check size={11} className="text-teal" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Order',
      accessorKey: 'orderNumber',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <Link
              to={`/admin/orders/${item.orderId}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-xs! font-semibold text-teal hover:underline flex items-center gap-1"
            >
              #{item.orderNumber}
              <ExternalLink size={11} />
            </Link>
            <span className="text-[11px]! text-ink-soft">
              {item.order.itemCount} items • {item.order.orderStatus}
            </span>
          </div>
        )
      },
    },
    {
      header: 'Customer',
      accessorKey: 'customer',
      cell: ({ row }) => {
        const cust = row.original.customer
        return (
          <div className="flex flex-col gap-0.5 max-w-[200px]">
            <span className="text-xs! font-medium text-ink truncate">
              {cust.fullName}
            </span>
            <span className="text-[11px]! text-ink-soft truncate">
              {cust.mobileNumber}
              {cust.city ? ` • ${cust.city}` : ''}
            </span>
          </div>
        )
      },
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs! font-bold text-ink">
            {formatINR(row.original.amount)}
          </span>
          <span className="text-[10px]! uppercase text-ink-soft">
            {row.original.currency}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
    },
    {
      header: 'Date',
      accessorKey: 'createdOn',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex flex-col text-[11px]! text-ink-soft">
            <span>{formatDateTime(item.paidOn || item.createdOn)}</span>
            {item.paidOn && (
              <span className="text-[10px]! text-teal font-medium">Captured</span>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPaymentId(item.id)}
              className="h-7 px-2 text-xs! flex items-center gap-1"
              title="Quick peek"
            >
              <Eye size={13} />
              <span>Peek</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/payments/${item.id}`)}
              className="h-7 px-2 text-xs! flex items-center gap-1 text-teal"
              title="Full Details"
            >
              <ExternalLink size={13} />
            </Button>
          </div>
        )
      },
    },
  ], [copiedId, copyToClipboard, navigate])

  const statusTabs = [
    { key: 'ALL', label: 'All Payments', count: summary.total },
    { key: 'Paid', label: 'Paid', count: summary.paid },
    { key: 'Pending', label: 'Pending', count: summary.pending },
    { key: 'Failed', label: 'Failed', count: summary.failed },
    { key: 'Expired', label: 'Expired', count: summary.expired },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl! font-bold text-ink">Payments</h1>
          <p className="mt-1 text-sm! text-ink-soft">
            Live transaction history, gateway captures, and payment audit logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs!"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:gap-4">
        <div className="rounded-xl border border-ink/10 bg-surface-card p-4">
          <div className="flex items-center gap-2 text-xs! font-semibold text-ink-soft">
            <CreditCard size={14} />
            <span>Total Payments</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-ink">
            {summary.total}
          </div>
          <div className="mt-0.5 text-[11px]! text-ink-soft">Across all orders</div>
        </div>

        <div className="rounded-xl border border-teal/20 bg-teal/5 p-4">
          <div className="flex items-center gap-2 text-xs! font-semibold text-teal">
            <CheckCircle2 size={14} />
            <span>Paid Revenue</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-teal">
            {formatINR(summary.totalPaidAmount)}
          </div>
          <div className="mt-0.5 text-[11px]! text-teal/80 font-medium">
            {summary.paid} captured orders
          </div>
        </div>

        <div className="rounded-xl border border-turmeric/20 bg-turmeric/5 p-4">
          <div className="flex items-center gap-2 text-xs! font-semibold text-turmeric">
            <Clock size={14} />
            <span>Pending</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-turmeric">
            {summary.pending}
          </div>
          <div className="mt-0.5 text-[11px]! text-turmeric/80">Awaiting payment</div>
        </div>

        <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-4">
          <div className="flex items-center gap-2 text-xs! font-semibold text-oxblood">
            <XCircle size={14} />
            <span>Failed</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-oxblood">
            {summary.failed}
          </div>
          <div className="mt-0.5 text-[11px]! text-oxblood/80">Rejected by gateway</div>
        </div>

        <div className="rounded-xl border border-ink/10 bg-surface-card p-4">
          <div className="flex items-center gap-2 text-xs! font-semibold text-ink-soft">
            <AlertTriangle size={14} />
            <span>Expired</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-ink">
            {summary.expired}
          </div>
          <div className="mt-0.5 text-[11px]! text-ink-soft">Window timed out</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key)
                  setPage(1)
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs! font-medium transition-colors shrink-0 ${
                  isActive
                    ? 'bg-ink text-ivory font-semibold shadow-xs'
                    : 'bg-surface-card text-ink-soft hover:bg-ivory hover:text-ink border border-ink/10'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px]! font-mono ${
                    isActive ? 'bg-ivory/20 text-ivory' : 'bg-ink/10 text-ink-soft'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by Payment ID, Razorpay ID, Order #, Customer Name, Mobile..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-surface-card pl-9 pr-9 py-2 text-xs! text-ink placeholder:text-ink-soft/70 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Data Table / States */}
      {error ? (
        <ServerError
          className="h-auto min-h-96 py-16"
          message={error}
          action={{ label: 'Retry', onClick: reload }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={payments}
          pageSize={PAGE_SIZE}
          isLoading={isInitialLoading}
          loadingRows={PAGE_SIZE}
          emptyMessage={
            debouncedSearch || statusFilter !== 'ALL'
              ? 'No payments match the selected criteria.'
              : 'No payment records found.'
          }
          hideFooter={!isInitialLoading && payments.length === 0 && page === 1}
          serverPagination={{
            page,
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages,
            isFetching,
            onPageChange: setPage,
          }}
        />
      )}

      {/* Quick Peek Drawer */}
      <AdminPaymentDrawer
        paymentId={selectedPaymentId}
        open={Boolean(selectedPaymentId)}
        onOpenChange={(open) => {
          if (!open) setSelectedPaymentId(null)
        }}
      />
    </div>
  )
}

