import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Eye,
  ExternalLink,
  RefreshCw,
  Search,
  Truck,
  Copy,
  Check,
} from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { useUrlPageParam } from '@/hooks/useUrlPageParam'
import { formatDateTime, formatINR } from '@/lib/utils'
import { useAdminOrders } from '@/hooks/useAdminOrders'
import { AdminOrderDrawer } from './AdminOrderDrawer'
import type {
  AdminOrderListItem,
  AdminOrderStatus,
  AdminOrderPaymentStatus,
  AdminOrderShipmentStatus,
} from '@/types/adminOrder'

const PAGE_SIZE = 20

function OrderStatusBadge({ status }: { status: AdminOrderStatus | string }) {
  switch (status) {
    case 'Confirmed':
      return <Badge variant="teal">Confirmed</Badge>
    case 'PendingPayment':
      return <Badge variant="turmeric">Pending Payment</Badge>
    case 'PaymentFailed':
      return <Badge variant="oxblood">Payment Failed</Badge>
    case 'Cancelled':
      return <Badge variant="outline">Cancelled</Badge>
    case 'Expired':
      return <Badge variant="soft">Expired</Badge>
    default:
      return <Badge variant="soft">{status}</Badge>
  }
}

function PaymentStatusBadge({ status }: { status: AdminOrderPaymentStatus | string }) {
  switch (status) {
    case 'Paid':
      return <Badge variant="teal">Paid</Badge>
    case 'Pending':
    case 'ProviderOrderCreated':
      return <Badge variant="turmeric">Pending</Badge>
    case 'Failed':
    case 'VerificationFailed':
      return <Badge variant="oxblood">Failed</Badge>
    default:
      return <Badge variant="soft">{status}</Badge>
  }
}

function ShipmentStatusBadge({
  status,
  courier,
}: {
  status: AdminOrderShipmentStatus | string | null
  courier?: string | null
}) {
  if (!status) return <Badge variant="soft">Unfulfilled</Badge>

  let badgeVariant: 'teal' | 'turmeric' | 'oxblood' | 'soft' = 'soft'
  if (status === 'Delivered') badgeVariant = 'teal'
  else if (['InTransit', 'OutForDelivery', 'PickedUp', 'AwbAssigned', 'CourierAssigned'].includes(status))
    badgeVariant = 'turmeric'
  else if (['DeliveryFailed', 'RtoInitiated', 'Cancelled'].includes(status))
    badgeVariant = 'oxblood'

  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge variant={badgeVariant}>{status}</Badge>
      {courier && (
        <span className="text-[11px]! text-ink-soft truncate max-w-28 flex items-center gap-1">
          <Truck size={10} /> {courier}
        </span>
      )}
    </div>
  )
}

export function AdminOrders() {
  const navigate = useNavigate()
  const { page, setPage } = useUrlPageParam()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL')
  const [shipmentFilter, setShipmentFilter] = useState<string>('ALL')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchInput.trim()
      setDebouncedSearch((curr) => {
        if (curr !== next) setPage(1)
        return next
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput, setPage])

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setPage(nextPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [setPage],
  )

  const {
    orders,
    summary,
    pagination,
    isInitialLoading,
    isFetching,
    error,
    reload,
  } = useAdminOrders({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    status: statusFilter,
    paymentStatus: paymentFilter,
    shipmentStatus: shipmentFilter,
    onPageChange: setPage,
  })

  const copyOrderNumber = (orderNumber: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(orderNumber)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const columns = useMemo<ColumnDef<AdminOrderListItem, unknown>[]>(
    () => [
      {
        header: 'Order #',
        accessorKey: 'orderNumber',
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderId(item.id)}
                className="font-mono text-xs! font-bold text-teal hover:underline text-left"
              >
                #{item.orderNumber}
              </button>
              <button
                type="button"
                onClick={(e) => copyOrderNumber(item.orderNumber, item.id, e)}
                className="p-1 text-ink-soft hover:text-ink rounded"
                title="Copy order number"
              >
                {copiedId === item.id ? (
                  <Check size={12} className="text-teal" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>
          )
        },
      },
      {
        header: 'Date',
        accessorKey: 'createdOn',
        cell: ({ row }) => (
          <time dateTime={row.original.createdOn} className="whitespace-nowrap text-xs! text-ink-soft">
            {formatDateTime(row.original.createdOn)}
          </time>
        ),
      },
      {
        header: 'Customer',
        id: 'customer',
        cell: ({ row }) => {
          const cust = row.original.customer
          return (
            <div className="min-w-0 max-w-44">
              <p className="truncate text-sm! font-medium text-ink">{cust.fullName}</p>
              <p className="truncate font-mono text-xs! text-ink-soft">{cust.mobileNumber}</p>
            </div>
          )
        },
      },
      {
        header: 'Items',
        id: 'items',
        cell: ({ row }) => {
          const item = row.original
          const titleSummary = item.items.map((i) => i.productName).join(', ')
          return (
            <div className="max-w-48" title={titleSummary}>
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs! font-medium text-ink">
                {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
              </span>
              <p className="truncate text-[11px]! text-ink-soft mt-0.5">{titleSummary}</p>
            </div>
          )
        },
      },
      {
        header: 'Total',
        accessorKey: 'grandTotal',
        cell: ({ row }) => (
          <span className="font-mono text-sm! font-bold text-oxblood">
            {formatINR(row.original.grandTotal)}
          </span>
        ),
      },
      {
        header: 'Payment',
        accessorKey: 'paymentStatus',
        cell: ({ row }) => <PaymentStatusBadge status={row.original.paymentStatus} />,
      },
      {
        header: 'Shipment',
        id: 'shipment',
        cell: ({ row }) => (
          <ShipmentStatusBadge
            status={row.original.shipmentStatus}
            courier={row.original.courierName}
          />
        ),
      },
      {
        header: 'Status',
        accessorKey: 'orderStatus',
        cell: ({ row }) => <OrderStatusBadge status={row.original.orderStatus} />,
      },
      {
        header: '',
        id: 'actions',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedOrderId(item.id)}
                className="flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1 text-xs! font-medium text-ink hover:bg-ink/5 transition-colors"
                title="Quick View Drawer"
              >
                <Eye size={13} /> View
              </button>
              <button
                type="button"
                onClick={() => navigate(`/admin/orders/${item.id}`)}
                className="rounded-full p-1.5 text-ink-soft hover:text-ink hover:bg-ink/5 transition-colors"
                title="Open Full Order Detail Page"
              >
                <ExternalLink size={14} />
              </button>
            </div>
          )
        },
      },
    ],
    [copiedId, navigate],
  )

  const statusTabs = [
    { label: 'All', value: 'ALL', count: summary?.total },
    { label: 'Confirmed', value: 'Confirmed', count: summary?.confirmed },
    { label: 'Pending Payment', value: 'PendingPayment', count: summary?.pendingPayment },
    { label: 'Payment Failed', value: 'PaymentFailed', count: summary?.paymentFailed },
    { label: 'Cancelled', value: 'Cancelled', count: summary?.cancelled },
    { label: 'Expired', value: 'Expired', count: summary?.expired },
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl!">Orders</h1>
          <p className="flex items-center gap-2 text-sm! text-ink-soft">
            {isInitialLoading
              ? 'Loading orders...'
              : `${pagination.totalCount} orders total`}
            {isFetching && !isInitialLoading && (
              <span className="flex items-center gap-1 text-xs! text-turmeric-deep">
                <RefreshCw size={11} className="animate-spin" /> Updating...
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-ink/10 pb-3">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value)
                setPage(1)
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs! font-medium transition-colors ${
                isActive
                  ? 'bg-oxblood text-ivory'
                  : 'bg-ivory-dim text-ink-soft hover:bg-ink/5 hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px]! font-mono ${
                    isActive ? 'bg-ivory/20 text-ivory' : 'bg-ink/10 text-ink-soft'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search and Secondary Filter Controls */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {/* Search Box */}
        <div className="relative sm:col-span-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by Order #, Customer, Phone, Email..."
            className="w-full rounded-xl border border-ink/15 bg-ivory pl-9 pr-3 py-2 text-xs! text-ink placeholder:text-ink-soft/60 focus:border-oxblood focus:outline-none"
          />
        </div>

        {/* Payment Status Dropdown */}
        <div>
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-xs! text-ink focus:border-oxblood focus:outline-none"
          >
            <option value="ALL">Payment: All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        {/* Shipment Status Dropdown */}
        <div>
          <select
            value={shipmentFilter}
            onChange={(e) => {
              setShipmentFilter(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-xl border border-ink/15 bg-ivory px-3 py-2 text-xs! text-ink focus:border-oxblood focus:outline-none"
          >
            <option value="ALL">Shipment: All</option>
            <option value="Created">Created</option>
            <option value="AwbAssigned">AWB Assigned</option>
            <option value="InTransit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
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
          data={orders}
          pageSize={pagination.pageSize}
          isLoading={isInitialLoading}
          loadingRows={pagination.pageSize}
          emptyMessage={
            debouncedSearch || statusFilter !== 'ALL'
              ? 'No matching orders found for the applied filters.'
              : 'No orders placed yet.'
          }
          hideFooter={!isInitialLoading && orders.length === 0 && page === 1}
          serverPagination={{
            page: pagination.page,
            hasPreviousPage: pagination.hasPreviousPage,
            hasNextPage: pagination.hasNextPage,
            isFetching,
            onPageChange: handlePageChange,
          }}
        />
      )}

      {/* Quick View Drawer */}
      <AdminOrderDrawer
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />
    </div>
  )
}
