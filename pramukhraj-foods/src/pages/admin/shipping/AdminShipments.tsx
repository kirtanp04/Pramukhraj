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
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  X,
  MapPin,
  FileText,
} from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/Button'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { useUrlPageParam } from '@/hooks/useUrlPageParam'
import { formatDateTime, formatINR } from '@/lib/utils'
import { useAdminShipments } from '@/hooks/useAdminShipments'
import { AdminShipmentDrawer, ShipmentStatusBadge } from './AdminShipmentDrawer'
import type {
  AdminShipmentListItem,
  AdminShipmentTabStatus,
} from '@/types/adminShipment'

const PAGE_SIZE = 20

const STATUS_TABS: { key: AdminShipmentTabStatus; label: string }[] = [
  { key: 'ALL', label: 'All Shipments' },
  { key: 'PendingPickup', label: 'Pending Pickup' },
  { key: 'InTransit', label: 'In Transit' },
  { key: 'Delivered', label: 'Delivered' },
  { key: 'FailedOrRto', label: 'Failed / RTO' },
]

export function AdminShipments() {
  const navigate = useNavigate()
  const { page, setPage } = useUrlPageParam()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminShipmentTabStatus>('ALL')
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null)
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
    shipments,
    totalPages,
    summary,
    isInitialLoading,
    isFetching,
    error,
    reload,
  } = useAdminShipments({
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

  const columns = useMemo<ColumnDef<AdminShipmentListItem, any>[]>(() => [
    {
      header: 'Shipment & AWB',
      accessorKey: 'awbCode',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs! font-bold text-ink">
                {item.awbCode || 'Pending AWB'}
              </span>
              {item.awbCode && (
                <button
                  type="button"
                  onClick={(e) => copyToClipboard(item.awbCode!, item.id, e)}
                  className="rounded p-0.5 text-ink-soft hover:bg-ink/5 hover:text-ink transition-colors"
                  title="Copy AWB code"
                >
                  {copiedId === item.id ? (
                    <Check size={12} className="text-teal" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs! text-ink-soft">
              <Truck size={12} className="text-turmeric-deep shrink-0" />
              <span className="font-medium text-ink">{item.courierName || 'Shiprocket'}</span>
            </div>
            {(item.providerOrderId > 0 || item.providerShipmentId > 0) && (
              <span className="font-mono text-[10px]! text-ink-soft">
                SR #{item.providerShipmentId || item.providerOrderId}
              </span>
            )}
          </div>
        )
      },
    },
    {
      header: 'Linked Order',
      accessorKey: 'orderNumber',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <Link
              to={`/admin/orders/${item.orderId}`}
              className="flex items-center gap-1 text-xs! font-bold text-teal hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <span>#{item.order.orderNumber}</span>
              <ExternalLink size={10} />
            </Link>
            <div className="flex items-center gap-1.5 text-xs! text-ink-soft">
              <Package size={11} />
              <span>{item.order.itemCount} items</span>
              <span>•</span>
              <span className="font-semibold text-ink">{formatINR(item.order.grandTotal)}</span>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Customer & Destination',
      accessorKey: 'customer',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-xs! font-medium text-ink truncate max-w-44">
                {item.customer.fullName}
              </span>
              {item.customer.isBlocked && (
                <span className="rounded bg-oxblood/10 px-1 py-0.2 text-[9px]! font-semibold text-oxblood">
                  Blocked
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px]! text-ink-soft">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate max-w-44">
                {item.customer.city ? `${item.customer.city}, ${item.customer.state || ''}` : 'Location on Order'}
              </span>
            </div>
            <span className="font-mono text-[11px]! text-ink-soft">
              {item.customer.mobileNumber}
            </span>
          </div>
        )
      },
    },
    {
      header: 'Shipping Cost',
      accessorKey: 'providerShippingCharge',
      cell: ({ row }) => {
        const charge = row.original.providerShippingCharge
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs! font-bold text-ink">{formatINR(charge)}</span>
            <span className="text-[10px]! text-ink-soft">Courier Fee</span>
          </div>
        )
      },
    },
    {
      header: 'Status & Latest Scan',
      accessorKey: 'status',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex flex-col gap-1 max-w-xs">
            <div className="flex items-center gap-2">
              <ShipmentStatusBadge status={item.status} />
              {item.activityCount > 0 && (
                <span className="rounded-full bg-ink/5 px-1.5 py-0.2 text-[10px]! font-medium text-ink-soft">
                  {item.activityCount} scans
                </span>
              )}
            </div>
            {item.latestActivity ? (
              <p className="text-[11px]! text-ink leading-tight truncate">
                {item.latestActivity}
                {item.latestLocation ? ` (${item.latestLocation})` : ''}
              </p>
            ) : (
              <span className="text-[11px]! text-ink-soft">
                Updated {formatDateTime(item.updatedOn)}
              </span>
            )}
          </div>
        )
      },
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedShipmentId(item.id)}
              className="h-7 w-7 p-0"
              title="Quick peek shipment details"
            >
              <Eye size={13} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/shipping/${item.id}`)}
              className="h-7 w-7 p-0"
              title="View full shipment page"
            >
              <ExternalLink size={13} />
            </Button>
            {item.trackingUrl && (
              <a
                href={item.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-ink/15 text-ink hover:bg-ink/5 transition-colors"
                title="Track on carrier site"
              >
                <Truck size={13} />
              </a>
            )}
            {item.labelUrl && (
              <a
                href={item.labelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-ink/15 text-ink hover:bg-ink/5 transition-colors"
                title="Print shipping label"
              >
                <FileText size={13} />
              </a>
            )}
          </div>
        )
      },
    },
  ], [copiedId, copyToClipboard, navigate])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl! font-bold text-ink">Shipping & Fulfillment</h1>
          <p className="mt-1 text-sm! text-ink-soft">
            Live carrier dispatch tracking, AWB assignments, and delivery fulfillment monitoring.
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 lg:gap-4">
        <div className="rounded-xl border border-ink/10 bg-surface-card p-4">
          <div className="flex items-center gap-2 text-xs! font-semibold text-ink-soft">
            <Truck size={14} />
            <span>Total</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-ink">
            {summary.total}
          </div>
          <div className="mt-0.5 text-[11px]! text-ink-soft">All shipments</div>
        </div>

        <div className="rounded-xl border border-turmeric/20 bg-turmeric/5 p-4">
          <div className="flex items-center gap-2 text-xs! font-semibold text-turmeric-deep">
            <Clock size={14} />
            <span>Pending Pickup</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-turmeric-deep">
            {summary.pendingPickup}
          </div>
          <div className="mt-0.5 text-[11px]! text-turmeric-deep/80 font-medium">
            Awaiting dispatch
          </div>
        </div>

        <div className="rounded-xl border border-teal/20 bg-teal/5 p-4">
          <div className="flex items-center gap-2 text-xs! font-semibold text-teal">
            <Truck size={14} />
            <span>In Transit</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-teal">
            {summary.inTransit}
          </div>
          <div className="mt-0.5 text-[11px]! text-teal/80 font-medium">
            Active carrier transit
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 text-xs! font-semibold text-emerald-600">
            <CheckCircle2 size={14} />
            <span>Delivered</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-emerald-600">
            {summary.delivered}
          </div>
          <div className="mt-0.5 text-[11px]! text-emerald-600/80 font-medium">
            Completed delivery
          </div>
        </div>

        <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-4">
          <div className="flex items-center gap-2 text-xs! font-semibold text-oxblood">
            <XCircle size={14} />
            <span>Failed / RTO</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-oxblood">
            {summary.failedOrRto}
          </div>
          <div className="mt-0.5 text-[11px]! text-oxblood/80 font-medium">
            Delivery issues & return
          </div>
        </div>

        <div className="rounded-xl border border-ink/10 bg-surface-card p-4">
          <div className="flex items-center gap-2 text-xs! font-semibold text-ink-soft">
            <FileText size={14} />
            <span>Total Charges</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-ink">
            {formatINR(summary.totalShippingCharges)}
          </div>
          <div className="mt-0.5 text-[11px]! text-ink-soft">Courier spend</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => {
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
                    : 'border border-ink/10 bg-surface-card text-ink hover:bg-ink/5'
                }`}
              >
                <span>{tab.label}</span>
                {tab.key === 'ALL' && summary.total > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px]! ${
                      isActive ? 'bg-ivory/20 text-ivory' : 'bg-ink/10 text-ink'
                    }`}
                  >
                    {summary.total}
                  </span>
                )}
                {tab.key === 'PendingPickup' && summary.pendingPickup > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px]! ${
                      isActive ? 'bg-ivory/20 text-ivory' : 'bg-turmeric/20 text-turmeric-deep'
                    }`}
                  >
                    {summary.pendingPickup}
                  </span>
                )}
                {tab.key === 'InTransit' && summary.inTransit > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px]! ${
                      isActive ? 'bg-ivory/20 text-ivory' : 'bg-teal/20 text-teal'
                    }`}
                  >
                    {summary.inTransit}
                  </span>
                )}
                {tab.key === 'Delivered' && summary.delivered > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px]! ${
                      isActive ? 'bg-ivory/20 text-ivory' : 'bg-emerald-500/20 text-emerald-700'
                    }`}
                  >
                    {summary.delivered}
                  </span>
                )}
                {tab.key === 'FailedOrRto' && summary.failedOrRto > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px]! ${
                      isActive ? 'bg-ivory/20 text-ivory' : 'bg-oxblood/20 text-oxblood'
                    }`}
                  >
                    {summary.failedOrRto}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by AWB, courier, order #, customer, or city..."
              className="w-full rounded-lg border border-ink/15 bg-surface-card py-2 pl-9 pr-9 text-xs! text-ink placeholder:text-ink-soft focus:border-ink focus:outline-none"
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
          data={shipments}
          pageSize={PAGE_SIZE}
          isLoading={isInitialLoading}
          loadingRows={PAGE_SIZE}
          emptyMessage={
            debouncedSearch || statusFilter !== 'ALL'
              ? 'No shipments match the selected criteria.'
              : 'No shipment records found.'
          }
          hideFooter={!isInitialLoading && shipments.length === 0 && page === 1}
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
      <AdminShipmentDrawer
        shipmentId={selectedShipmentId}
        open={Boolean(selectedShipmentId)}
        onOpenChange={(open) => {
          if (!open) setSelectedShipmentId(null)
        }}
      />
    </div>
  )
}

