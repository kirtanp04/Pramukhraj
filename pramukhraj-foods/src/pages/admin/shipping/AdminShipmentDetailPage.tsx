import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  Calendar,
  AlertCircle,
  Hash,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { getApiErrorMessage } from '@/lib/apiClient'
import { formatDateTime, formatINR } from '@/lib/utils'
import { adminShipmentApi } from '@/services/adminShipmentApi'
import { ShipmentStatusBadge } from './AdminShipmentDrawer'
import type { AdminShipmentDetail } from '@/types/adminShipment'

export function AdminShipmentDetailPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>()
  const navigate = useNavigate()

  const [shipment, setShipment] = useState<AdminShipmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const fetchDetail = () => {
    if (!shipmentId) return
    setLoading(true)
    setError(null)
    adminShipmentApi
      .getById(shipmentId)
      .then(setShipment)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDetail()
  }, [shipmentId])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-60 rounded-xl" />
            <Skeleton className="h-60 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/shipping')}
          className="flex items-center gap-1 text-xs!"
        >
          <ArrowLeft size={13} />
          <span>Back to Shipments</span>
        </Button>
        <ServerError
          className="h-auto min-h-96 py-16"
          message={error || 'Shipment not found'}
          action={{ label: 'Retry', onClick: fetchDetail }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/shipping')}
            className="h-9 w-9 p-0"
            title="Back to shipments list"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl! font-bold text-ink">
                {shipment.awbCode || 'Pending AWB'}
              </h1>
              <ShipmentStatusBadge status={shipment.status} />
            </div>
            <p className="mt-0.5 text-xs! text-ink-soft">
              Order #{shipment.orderNumber} • Dispatched via{' '}
              <span className="font-semibold text-ink">
                {shipment.courierName || 'Shiprocket'}
              </span>{' '}
              • {formatDateTime(shipment.createdOn)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDetail}
            className="flex items-center gap-1.5 text-xs!"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </Button>

          {shipment.trackingUrl && (
            <a
              href={shipment.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-ivory px-3 py-1.5 text-xs! font-medium text-ink hover:bg-ivory-dim transition-colors"
            >
              <Truck size={13} />
              <span>Track Online</span>
              <ExternalLink size={11} />
            </a>
          )}

          {shipment.labelUrl && (
            <a
              href={shipment.labelUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal/30 bg-teal/5 px-3 py-1.5 text-xs! font-medium text-teal hover:bg-teal/10 transition-colors"
            >
              <FileText size={13} />
              <span>Print Label</span>
              <ExternalLink size={11} />
            </a>
          )}

          {shipment.manifestUrl && (
            <a
              href={shipment.manifestUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-ivory px-3 py-1.5 text-xs! font-medium text-ink hover:bg-ivory-dim transition-colors"
            >
              <FileText size={13} />
              <span>Manifest</span>
              <ExternalLink size={11} />
            </a>
          )}

          <Link
            to={`/admin/orders/${shipment.orderId}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs! font-medium text-ivory hover:bg-ink/90 transition-colors"
          >
            <Package size={13} />
            <span>View Order</span>
          </Link>
        </div>
      </div>

      {/* Warning banner for errors */}
      {shipment.lastError && (
        <div className="rounded-xl border border-oxblood/30 bg-oxblood/5 p-4 text-xs! text-oxblood flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Carrier / Sync Alert: </span>
            <span>{shipment.lastError}</span>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-4">
          <div className="flex items-center gap-1.5 text-xs! font-semibold text-ink-soft">
            <Truck size={14} className="text-turmeric-deep" />
            <span>Courier Service</span>
          </div>
          <div className="mt-2 font-display text-lg! font-bold text-ink truncate">
            {shipment.courierName || 'Shiprocket'}
          </div>
          <div className="mt-0.5 font-mono text-[11px]! text-ink-soft truncate">
            ID: {shipment.courierCompanyId || 'Auto Assigned'}
          </div>
        </div>

        <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs! font-semibold text-ink-soft">
              <Hash size={14} />
              <span>AWB Number</span>
            </div>
            {shipment.awbCode && (
              <button
                type="button"
                onClick={() => copyToClipboard(shipment.awbCode!, 'awb-card')}
                className="rounded p-0.5 text-ink-soft hover:text-ink transition-colors"
                title="Copy AWB"
              >
                {copiedKey === 'awb-card' ? (
                  <Check size={13} className="text-teal" />
                ) : (
                  <Copy size={13} />
                )}
              </button>
            )}
          </div>
          <div className="mt-2 font-mono text-base! font-bold text-ink truncate">
            {shipment.awbCode || 'Pending'}
          </div>
          <div className="mt-0.5 text-[11px]! text-ink-soft">
            Status: {shipment.providerStatus || shipment.status}
          </div>
        </div>

        <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-4">
          <div className="flex items-center gap-1.5 text-xs! font-semibold text-ink-soft">
            <FileText size={14} />
            <span>Shipping Cost</span>
          </div>
          <div className="mt-2 font-display text-lg! font-bold text-ink">
            {formatINR(shipment.providerShippingCharge)}
          </div>
          <div className="mt-0.5 text-[11px]! text-ink-soft">
            Billed on fulfillment
          </div>
        </div>

        <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-4">
          <div className="flex items-center gap-1.5 text-xs! font-semibold text-ink-soft">
            <Calendar size={14} />
            <span>Estimated Delivery</span>
          </div>
          <div className="mt-2 text-sm! font-bold text-ink">
            {shipment.estimatedDeliveryOn
              ? formatDateTime(shipment.estimatedDeliveryOn)
              : 'Pending carrier ETA'}
          </div>
          <div className="mt-0.5 text-[11px]! text-teal font-medium">
            {shipment.deliveredOn
              ? `Delivered ${formatDateTime(shipment.deliveredOn)}`
              : 'In progress'}
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Milestones & Line Items) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tracking Milestone Scans */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-teal" />
                <h3 className="font-display text-base! font-bold text-ink">
                  Tracking Scan History ({shipment.activities.length})
                </h3>
              </div>
              {shipment.trackingUrl && (
                <a
                  href={shipment.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs! font-medium text-teal hover:underline"
                >
                  <span>Carrier Tracker</span>
                  <ExternalLink size={11} />
                </a>
              )}
            </div>

            {shipment.activities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink/15 bg-ivory py-8 text-center">
                <Truck size={32} className="mx-auto text-ink-soft/40" />
                <p className="mt-2 text-xs! text-ink-soft font-medium">
                  No checkpoint scans reported by carrier yet.
                </p>
                <p className="text-[11px]! text-ink-soft/80">
                  Tracking events will automatically appear here as the package moves across carrier hubs.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 border-l-2 border-ink/10 mt-2">
                {shipment.activities.map((act, index) => {
                  const isLatest = index === 0
                  return (
                    <div key={act.id} className="relative group">
                      <div
                        className={`absolute -left-[31px] top-3 h-3.5 w-3.5 rounded-full border-2 border-ivory-dim ${
                          isLatest ? 'bg-teal ring-4 ring-teal/20' : 'bg-ink/30'
                        }`}
                      />
                      <div className="rounded-lg bg-ivory p-3 border border-ink/5 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`text-xs! font-bold ${
                              isLatest ? 'text-teal' : 'text-ink'
                            }`}
                          >
                            {act.activity}
                          </span>
                          {act.status && (
                            <span className="rounded bg-ink/5 px-2 py-0.5 text-[10px]! font-semibold text-ink">
                              {act.status}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs! text-ink-soft">
                          <span>{formatDateTime(act.date)}</span>
                          {act.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin size={11} />
                                <span>{act.location}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Package Line Items */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-3">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-turmeric-deep" />
                <h3 className="font-display text-base! font-bold text-ink">
                  Package Contents ({shipment.order.items.length} items)
                </h3>
              </div>
              <span className="text-xs! text-ink-soft">
                Order #{shipment.orderNumber}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs!">
                <thead>
                  <tr className="border-b border-ink/10 text-left text-[11px]! font-semibold text-ink-soft uppercase tracking-wider">
                    <th className="pb-2">Product & SKU</th>
                    <th className="pb-2 text-center">Unit Weight</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {shipment.order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-ivory/50 transition-colors">
                      <td className="py-2.5 pr-2">
                        <div className="font-medium text-ink">{item.productName}</div>
                        <div className="flex items-center gap-2 text-[11px]! text-ink-soft">
                          <span>{item.variantName}</span>
                          <span>•</span>
                          <span className="font-mono">{item.sku}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center text-ink-soft">
                        {item.weight} {item.weightUnit}
                      </td>
                      <td className="py-2.5 px-2 text-center font-semibold text-ink">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-ink">
                        {formatINR(item.unitPrice)}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-bold text-ink font-mono">
                        {formatINR(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Addresses, Financials, Audit) */}
        <div className="space-y-6">
          {/* Destination & Recipient Card */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5 space-y-3">
            <h3 className="flex items-center gap-2 text-xs! font-bold uppercase tracking-wider text-ink border-b border-ink/5 pb-2.5">
              <MapPin size={14} className="text-ink-soft" />
              <span>Recipient & Delivery Address</span>
            </h3>
            <div className="space-y-2 text-xs!">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-sm!">
                  {shipment.order.shippingAddress?.recipientName || shipment.customer.fullName}
                </span>
                {shipment.customer.isBlocked && (
                  <Badge variant="oxblood" className="text-[9px]!">Blocked</Badge>
                )}
              </div>
              <div className="space-y-0.5 text-ink-soft">
                <p>Mobile: <span className="font-mono text-ink font-medium">{shipment.order.shippingAddress?.mobileNumber || shipment.customer.mobileNumber}</span></p>
                {(shipment.order.shippingAddress?.email || shipment.customer.email) && (
                  <p>Email: <span className="text-ink">{shipment.order.shippingAddress?.email || shipment.customer.email}</span></p>
                )}
              </div>
              {shipment.order.shippingAddress && (
                <div className="mt-2 rounded-xl bg-ivory p-3.5 border border-ink/5 text-ink-soft leading-relaxed">
                  <p className="text-ink font-medium">{shipment.order.shippingAddress.addressLine1}</p>
                  {shipment.order.shippingAddress.addressLine2 && (
                    <p>{shipment.order.shippingAddress.addressLine2}</p>
                  )}
                  {shipment.order.shippingAddress.landmark && (
                    <p className="text-[11px]! italic">Near {shipment.order.shippingAddress.landmark}</p>
                  )}
                  <p className="mt-1 font-semibold text-ink">
                    {shipment.order.shippingAddress.city}, {shipment.order.shippingAddress.state} -{' '}
                    {shipment.order.shippingAddress.postalCode}
                  </p>
                  <p className="text-[11px]!">{shipment.order.shippingAddress.country}</p>
                </div>
              )}
            </div>
          </div>

          {/* Linked Order Financials */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-ink/5 pb-2.5">
              <h3 className="flex items-center gap-2 text-xs! font-bold uppercase tracking-wider text-ink">
                <Package size={14} className="text-ink-soft" />
                <span>Order Summary</span>
              </h3>
              <Link
                to={`/admin/orders/${shipment.orderId}`}
                className="text-xs! font-semibold text-teal hover:underline flex items-center gap-1"
              >
                <span>#{shipment.orderNumber}</span>
                <ExternalLink size={10} />
              </Link>
            </div>
            <div className="space-y-2 text-xs!">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Order Status</span>
                <span className="font-semibold text-ink">{shipment.order.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Payment Status</span>
                <span className="font-semibold text-ink">{shipment.order.paymentStatus}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-ink/5">
                <span className="text-ink-soft">Items Subtotal</span>
                <span className="font-mono text-ink">{formatINR(shipment.order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Customer Shipping Fee</span>
                <span className="font-mono text-ink">{formatINR(shipment.order.shippingAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">{shipment.order.taxAmount > 0 ? "Tax Amount" : "Taxes"}</span>
                <span className="font-mono text-ink">
                  {shipment.order.taxAmount > 0 ? formatINR(shipment.order.taxAmount) : "None (0%)"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-ink/10 text-sm!">
                <span className="font-bold text-ink">Order Grand Total</span>
                <span className="font-bold text-teal font-mono">{formatINR(shipment.order.grandTotal)}</span>
              </div>
              {shipment.order.customerNote && (
                <div className="mt-2 rounded-lg bg-turmeric/5 border border-turmeric/20 p-2.5 text-[11px]! text-turmeric-deep">
                  <span className="font-bold">Customer Note: </span>
                  <span>{shipment.order.customerNote}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment & Provider Audit */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5 space-y-3">
            <h3 className="flex items-center gap-2 text-xs! font-bold uppercase tracking-wider text-ink border-b border-ink/5 pb-2.5">
              <Calendar size={14} className="text-ink-soft" />
              <span>Carrier & Dispatch Audit</span>
            </h3>
            <div className="space-y-2 text-xs!">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Shiprocket Order ID</span>
                <span className="font-mono font-medium text-ink">{shipment.providerOrderId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Shiprocket Shipment ID</span>
                <span className="font-mono font-medium text-ink">{shipment.providerShipmentId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Pickup Scheduled On</span>
                <span className="font-medium text-ink">
                  {shipment.pickupScheduledOn ? formatDateTime(shipment.pickupScheduledOn) : 'Not scheduled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Dispatched / Shipped</span>
                <span className="font-medium text-ink">
                  {shipment.shippedOn ? formatDateTime(shipment.shippedOn) : 'Pending dispatch'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Delivered Date</span>
                <span className="font-medium text-ink">
                  {shipment.deliveredOn ? formatDateTime(shipment.deliveredOn) : 'Pending delivery'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-ink/5">
                <span className="text-ink-soft">Last Updated</span>
                <span className="text-ink-soft">{formatDateTime(shipment.updatedOn)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
