import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  Package,
  User,
  MapPin,
  Truck,
  Copy,
  Check,
  Clock,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { getApiErrorMessage } from '@/lib/apiClient'
import { formatDateTime, formatINR } from '@/lib/utils'
import { adminShipmentApi } from '@/services/adminShipmentApi'
import type { AdminShipmentDetail, AdminShipmentStatus } from '@/types/adminShipment'

interface AdminShipmentDrawerProps {
  shipmentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShipmentStatusBadge({ status }: { status: AdminShipmentStatus | string }) {
  switch (status) {
    case 'Delivered':
      return <Badge variant="teal">Delivered</Badge>
    case 'InTransit':
    case 'PickedUp':
      return <Badge variant="teal">In Transit</Badge>
    case 'OutForDelivery':
      return <Badge variant="turmeric">Out For Delivery</Badge>
    case 'PickupScheduled':
      return <Badge variant="turmeric">Pickup Scheduled</Badge>
    case 'CourierAssigned':
    case 'AwbAssigned':
      return <Badge variant="soft">{status === 'AwbAssigned' ? 'AWB Assigned' : 'Courier Assigned'}</Badge>
    case 'Created':
      return <Badge variant="soft">Created</Badge>
    case 'DeliveryFailed':
      return <Badge variant="oxblood">Delivery Failed</Badge>
    case 'RtoInitiated':
    case 'RtoDelivered':
      return <Badge variant="oxblood">{status === 'RtoInitiated' ? 'RTO Initiated' : 'RTO Delivered'}</Badge>
    case 'Cancelled':
      return <Badge variant="outline">Cancelled</Badge>
    default:
      return <Badge variant="soft">{status}</Badge>
  }
}

export function AdminShipmentDrawer({
  shipmentId,
  open,
  onOpenChange,
}: AdminShipmentDrawerProps) {
  const [shipment, setShipment] = useState<AdminShipmentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !shipmentId) {
      setShipment(null)
      setError(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    adminShipmentApi
      .getById(shipmentId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setShipment(data)
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(getApiErrorMessage(err))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [open, shipmentId])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <AdminDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={shipment ? `Shipment ${shipment.awbCode || shipment.id.slice(0, 8)}` : 'Shipment Details'}
      description={shipment ? `Order #${shipment.orderNumber} • ${formatDateTime(shipment.createdOn)}` : undefined}
    >
      {loading && (
        <div className="space-y-6">
          <div className="rounded-xl border border-ink/10 bg-surface-card p-4 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="py-6">
          <ServerError
            className="h-auto min-h-72 py-10"
            message={error}
            action={{
              label: 'Retry',
              onClick: () => {
                if (shipmentId) {
                  setLoading(true)
                  setError(null)
                  adminShipmentApi
                    .getById(shipmentId)
                    .then(setShipment)
                    .catch((err) => setError(getApiErrorMessage(err)))
                    .finally(() => setLoading(false))
                }
              },
            }}
          />
        </div>
      )}

      {shipment && !loading && !error && (
        <div className="space-y-6 pb-6">
          {/* Header Card */}
          <div className="rounded-xl border bg-ivory-dim border-ink/10 bg-surface-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs! font-medium text-ink-soft">AWB Tracking Code</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-xl! font-bold text-ink">
                    {shipment.awbCode || 'Pending Assignment'}
                  </span>
                  {shipment.awbCode && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shipment.awbCode!, 'awb')}
                      className="rounded p-1 text-ink-soft hover:bg-ink/5 hover:text-ink transition-colors"
                      title="Copy AWB code"
                    >
                      {copiedKey === 'awb' ? <Check size={14} className="text-teal" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs! text-ink-soft">
                  <Truck size={13} className="text-turmeric-deep" />
                  <span className="font-medium text-ink">{shipment.courierName || 'Shiprocket Assigned Courier'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <ShipmentStatusBadge status={shipment.status} />
                <span className="text-xs! font-semibold text-ink">
                  {formatINR(shipment.providerShippingCharge)}
                </span>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-ink/5">
              <Link
                to={`/admin/shipping/${shipment.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs! font-medium text-ivory hover:bg-ink/90 transition-colors"
              >
                <span>Full Shipment Details</span>
                <ExternalLink size={12} />
              </Link>
              {shipment.trackingUrl && (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs! font-medium text-ink hover:bg-ink/5 transition-colors"
                >
                  <span>Track Online</span>
                  <ExternalLink size={12} />
                </a>
              )}
              {shipment.labelUrl && (
                <a
                  href={shipment.labelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs! font-medium text-ink hover:bg-ink/5 transition-colors"
                >
                  <FileText size={12} />
                  <span>Shipping Label</span>
                </a>
              )}
              {shipment.manifestUrl && (
                <a
                  href={shipment.manifestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-xs! font-medium text-ink hover:bg-ink/5 transition-colors"
                >
                  <FileText size={12} />
                  <span>Manifest</span>
                </a>
              )}
            </div>

            {shipment.lastError && (
              <div className="mt-3 rounded-lg border border-oxblood/20 bg-oxblood/5 p-3 text-xs! text-oxblood flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{shipment.lastError}</span>
              </div>
            )}
          </div>

          {/* Key Milestones & Dates */}
          <div className="rounded-xl border bg-ivory-dim border-ink/10 bg-surface-card p-4 space-y-3">
            <h4 className="flex items-center gap-2 text-xs! font-bold uppercase tracking-wider text-ink">
              <Calendar size={13} className="text-ink-soft" />
              <span>Key Shipping Milestones</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs!">
              <div>
                <span className="text-ink-soft">Created On</span>
                <p className="font-medium text-ink">{formatDateTime(shipment.createdOn)}</p>
              </div>
              <div>
                <span className="text-ink-soft">Pickup Scheduled</span>
                <p className="font-medium text-ink">
                  {shipment.pickupScheduledOn ? formatDateTime(shipment.pickupScheduledOn) : 'Not Scheduled'}
                </p>
              </div>
              <div>
                <span className="text-ink-soft">Shipped / Dispatched</span>
                <p className="font-medium text-ink">
                  {shipment.shippedOn ? formatDateTime(shipment.shippedOn) : 'Awaiting Dispatch'}
                </p>
              </div>
              <div>
                <span className="text-ink-soft">Estimated Delivery</span>
                <p className="font-medium text-ink">
                  {shipment.estimatedDeliveryOn ? formatDateTime(shipment.estimatedDeliveryOn) : 'Pending Carrier ETA'}
                </p>
              </div>
              {shipment.deliveredOn && (
                <div className="col-span-2 rounded-lg bg-teal/5 p-2.5 text-teal border border-teal/15">
                  <span className="text-xs! font-semibold">Delivered On:</span>{' '}
                  <span className="font-medium">{formatDateTime(shipment.deliveredOn)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Linked Order Snapshot */}
          <div className="rounded-xl border bg-ivory-dim border-ink/10 bg-surface-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-xs! font-bold uppercase tracking-wider text-ink">
                <Package size={13} className="text-ink-soft" />
                <span>Linked Order</span>
              </h4>
              <Link
                to={`/admin/orders/${shipment.orderId}`}
                className="flex items-center gap-1 text-xs! font-medium text-teal hover:underline"
              >
                <span>#{shipment.orderNumber}</span>
                <ExternalLink size={11} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs! border-b border-ink/5 pb-3">
              <div>
                <span className="text-ink-soft">Order Status</span>
                <p className="font-medium text-ink">{shipment.order.status}</p>
              </div>
              <div>
                <span className="text-ink-soft">Payment Status</span>
                <p className="font-medium text-ink">{shipment.order.paymentStatus}</p>
              </div>
              <div>
                <span className="text-ink-soft">Order Grand Total</span>
                <p className="font-bold text-ink">{formatINR(shipment.order.grandTotal)}</p>
              </div>
              <div>
                <span className="text-ink-soft">Items Count</span>
                <p className="font-medium text-ink">{shipment.order.items.length} items</p>
              </div>
            </div>

            {/* Item Mini List */}
            <div className="space-y-2">
              <span className="text-[11px]! font-semibold text-ink-soft uppercase tracking-wider">Line Items</span>
              {shipment.order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-ink/7 p-2 text-xs!"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{item.productName}</p>
                    <p className="text-[11px]! text-ink-soft">
                      {item.variantName} ({item.weight} {item.weightUnit}) × {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium text-ink">{formatINR(item.lineTotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer & Destination */}
          <div className="rounded-xl border bg-ivory-dim border-ink/10 bg-surface-card p-4 space-y-3">
            <h4 className="flex items-center gap-2 text-xs! font-bold uppercase tracking-wider text-ink">
              <MapPin size={13} className="text-ink-soft" />
              <span>Destination & Recipient</span>
            </h4>
            <div className="space-y-1.5 text-xs!">
              <div className="flex items-center gap-2">
                <User size={13} className="text-ink-soft" />
                <span className="font-semibold text-ink">
                  {shipment.order.shippingAddress?.recipientName || shipment.customer.fullName}
                </span>
                {shipment.customer.isBlocked && (
                  <Badge variant="oxblood" className="text-[9px]!">Blocked</Badge>
                )}
              </div>
              <p className="text-ink-soft">
                {shipment.order.shippingAddress?.mobileNumber || shipment.customer.mobileNumber}
                {(shipment.order.shippingAddress?.email || shipment.customer.email) &&
                  ` • ${shipment.order.shippingAddress?.email || shipment.customer.email}`}
              </p>
              {shipment.order.shippingAddress && (
                <div className="rounded-lg bg-ink/7 p-2.5 text-ink-soft">
                  <p className="text-ink">{shipment.order.shippingAddress.addressLine1}</p>
                  {shipment.order.shippingAddress.addressLine2 && (
                    <p>{shipment.order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {shipment.order.shippingAddress.city}, {shipment.order.shippingAddress.state} -{' '}
                    <span className="font-semibold text-ink">{shipment.order.shippingAddress.postalCode}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Activity / Scan Stream */}
          <div className="rounded-xl border bg-ivory-dim border-ink/10 bg-surface-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-xs! font-bold uppercase tracking-wider text-ink">
                <Clock size={13} className="text-ink-soft" />
                <span>Tracking Scans ({shipment.activities.length})</span>
              </h4>
            </div>

            {shipment.activities.length === 0 ? (
              <p className="text-xs! text-ink-soft italic py-2">
                No tracking scans recorded yet. Live updates will populate here upon carrier hub scans.
              </p>
            ) : (
              <div className="relative pl-4 space-y-4 border-l-2 border-ink/10">
                {shipment.activities.map((act) => (
                  <div key={act.id} className="relative group">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-surface-card bg-teal" />
                    <p className="text-xs! font-medium text-ink">{act.activity}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]! text-ink-soft">
                      <span>{formatDateTime(act.date)}</span>
                      {act.location && (
                        <>
                          <span>•</span>
                          <span>{act.location}</span>
                        </>
                      )}
                      {act.status && (
                        <span className="rounded bg-ink/5 px-1.5 py-0.2 text-[10px]! font-medium text-ink">
                          {act.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminDrawer>
  )
}
