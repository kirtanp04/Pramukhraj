import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  Package,
  Truck,
  User,
  MapPin,
  FileText,
  Copy,
  Check,
} from 'lucide-react'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { getApiErrorMessage } from '@/lib/apiClient'
import { formatDateTime, formatINR } from '@/lib/utils'
import { loadCustomerProductImage } from '@/services/customerProductImageLoader'
import { adminOrderApi } from '@/services/adminOrderApi'
import type { AdminOrderDetail } from '@/types/adminOrder'

interface AdminOrderDrawerProps {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function OrderStatusBadge({ status }: { status: string }) {
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

function PaymentStatusBadge({ status }: { status: string }) {
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

function ShipmentStatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="soft">Unfulfilled</Badge>
  switch (status) {
    case 'Delivered':
      return <Badge variant="teal">Delivered</Badge>
    case 'InTransit':
    case 'OutForDelivery':
    case 'PickedUp':
      return <Badge variant="turmeric">{status}</Badge>
    case 'DeliveryFailed':
    case 'RtoInitiated':
    case 'Cancelled':
      return <Badge variant="oxblood">{status}</Badge>
    default:
      return <Badge variant="soft">{status}</Badge>
  }
}

function DrawerItemRow({ item }: { item: AdminOrderDetail['items'][number] }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadCustomerProductImage(item.productId).then((url) => {
      if (active) setImageUrl(url)
    })
    return () => {
      active = false
    }
  }, [item.productId])

  return (
    <div className="flex items-center gap-3 rounded-lg bg-ivory p-2.5 border border-ink/5">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-ink/5 border border-ink/10 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={item.productName} className="h-full w-full object-cover" />
        ) : (
          <Package size={18} className="text-ink-soft/40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm! font-medium text-ink">{item.productName}</p>
        <p className="text-xs! text-ink-soft">
          {item.variantName ? `${item.variantName} · ` : ''}
          {item.weight} {item.weightUnit} · Qty: {item.quantity}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-sm! font-semibold text-oxblood">{formatINR(item.lineTotal)}</p>
        <p className="text-[11px]! text-ink-soft">{formatINR(item.unitPrice)} each</p>
      </div>
    </div>
  )
}

export function AdminOrderDrawer({ orderId, open, onOpenChange }: AdminOrderDrawerProps) {
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  useEffect(() => {
    if (!open || !orderId) {
      setDetail(null)
      setError(null)
      return
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    adminOrderApi
      .getById(orderId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setDetail(data)
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(getApiErrorMessage(err))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [open, orderId])

  const latestPayment = detail?.payments[0] ?? null
  const latestShipment = detail?.shipments[0] ?? null

  return (
    <AdminDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={detail ? `Order #${detail.orderNumber}` : 'Order Quick View'}
      description={detail ? `Placed on ${formatDateTime(detail.createdOn)}` : 'Loading order details...'}
    >
      {isLoading ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      ) : error ? (
        <ServerError
          message={error}
          action={{
            label: 'Retry',
            onClick: () => {
              if (orderId) {
                setIsLoading(true)
                setError(null)
                adminOrderApi
                  .getById(orderId)
                  .then(setDetail)
                  .catch((e: unknown) => setError(getApiErrorMessage(e)))
                  .finally(() => setIsLoading(false))
              }
            },
          }}
        />
      ) : detail ? (
        <div className="space-y-6 pb-6">
          {/* Quick Action Navigation to Full Detail Page */}
          <div className="flex items-center justify-between rounded-xl bg-ivory-dim p-3 border border-ink/10">
            <div>
              <p className="text-xs! text-ink-soft uppercase tracking-wider font-semibold">Deep Inspection</p>
              <p className="text-sm! font-medium text-ink">View complete transaction logs & audits</p>
            </div>
            <Link
              to={`/admin/orders/${detail.id}`}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-1.5 rounded-lg bg-teal px-3 py-1.5 text-xs! font-medium text-ivory hover:bg-teal-deep transition-colors"
            >
              Full Order Page <ExternalLink size={13} />
            </Link>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-ivory-dim p-2.5 border border-ink/5">
              <p className="text-[11px]! text-ink-soft mb-1 font-medium">Order</p>
              <OrderStatusBadge status={detail.status} />
            </div>
            <div className="rounded-lg bg-ivory-dim p-2.5 border border-ink/5">
              <p className="text-[11px]! text-ink-soft mb-1 font-medium">Payment</p>
              <PaymentStatusBadge status={latestPayment?.status ?? 'Pending'} />
            </div>
            <div className="rounded-lg bg-ivory-dim p-2.5 border border-ink/5">
              <p className="text-[11px]! text-ink-soft mb-1 font-medium">Shipment</p>
              <ShipmentStatusBadge status={latestShipment?.status ?? null} />
            </div>
          </div>

          {/* Customer Note Banner */}
          {detail.customerNote && (
            <div className="rounded-xl border border-turmeric/30 bg-turmeric/10 p-3">
              <p className="flex items-center gap-1.5 text-xs! font-semibold text-turmeric-deep">
                <FileText size={14} /> Customer Note
              </p>
              <p className="mt-1 text-xs! text-ink-soft italic leading-relaxed">
                "{detail.customerNote}"
              </p>
            </div>
          )}

          {/* Customer Information Card */}
          <div className="rounded-xl bg-ivory-dim p-4 border border-ink/5">
            <div className="flex items-center gap-2 mb-3">
              <User size={15} className="text-teal" />
              <p className="text-xs! uppercase tracking-wider font-semibold text-ink-soft">Customer</p>
            </div>
            <div className="space-y-1 text-sm!">
              <p className="font-semibold text-ink">{detail.customer.fullName}</p>
              <p className="font-mono text-xs! text-ink-soft">{detail.customer.mobileNumber}</p>
              {detail.customer.email && (
                <p className="text-xs! text-ink-soft">{detail.customer.email}</p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {detail.shippingAddress && (
            <div className="rounded-xl bg-ivory-dim p-4 border border-ink/5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={15} className="text-teal" />
                <p className="text-xs! uppercase tracking-wider font-semibold text-ink-soft">
                  Delivery Address
                </p>
              </div>
              <div className="space-y-0.5 text-xs! text-ink-soft leading-relaxed">
                <p className="font-semibold text-sm! text-ink mb-1">
                  {detail.shippingAddress.recipientName}
                </p>
                <p>{detail.shippingAddress.addressLine1}</p>
                {detail.shippingAddress.addressLine2 && <p>{detail.shippingAddress.addressLine2}</p>}
                {detail.shippingAddress.landmark && <p>Landmark: {detail.shippingAddress.landmark}</p>}
                <p>
                  {detail.shippingAddress.city}, {detail.shippingAddress.state} -{' '}
                  <span className="font-mono font-medium text-ink">{detail.shippingAddress.postalCode}</span>
                </p>
                <p className="mt-1 font-mono text-ink">Ph: {detail.shippingAddress.mobileNumber}</p>
              </div>
            </div>
          )}

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package size={15} className="text-teal" />
                <p className="text-xs! uppercase tracking-wider font-semibold text-ink-soft">
                  Items ({detail.items.reduce((s, i) => s + i.quantity, 0)})
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {detail.items.map((item) => (
                <DrawerItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="rounded-xl bg-ivory-dim p-4 border border-ink/5">
            <p className="text-xs! uppercase tracking-wider font-semibold text-ink-soft mb-3">
              Payment Summary
            </p>
            <div className="space-y-2 text-xs! text-ink-soft">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono text-ink">{formatINR(detail.subtotal)}</span>
              </div>
              {detail.couponDiscountAmount > 0 && (
                <div className="flex justify-between text-teal">
                  <span>Coupon Discount ({detail.couponCode || 'Promo'})</span>
                  <span className="font-mono">-{formatINR(detail.couponDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery / Shipping</span>
                <span className="font-mono text-ink">
                  {detail.shippingAmount > 0 ? formatINR(detail.shippingAmount) : 'Free'}
                </span>
              </div>
              {detail.paymentServiceTaxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Payment Processing Fee</span>
                  <span className="font-mono text-ink">
                    {formatINR(detail.paymentServiceTaxAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{detail.taxAmount > 0 ? 'Tax (GST)' : 'Taxes'}</span>
                <span className="font-mono text-ink">
                  {detail.taxAmount > 0 ? formatINR(detail.taxAmount) : 'None (0%)'}
                </span>
              </div>
              <div className="border-t border-ink/10 pt-2 flex justify-between text-sm! font-bold text-ink">
                <span>Grand Total</span>
                <span className="font-mono text-oxblood text-base!">{formatINR(detail.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Shipment & Tracking Snippet */}
          {latestShipment && (
            <div className="rounded-xl bg-ivory-dim p-4 border border-ink/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Truck size={15} className="text-teal" />
                  <p className="text-xs! uppercase tracking-wider font-semibold text-ink-soft">Fulfillment</p>
                </div>
                <ShipmentStatusBadge status={latestShipment.status} />
              </div>
              <div className="space-y-1.5 text-xs! text-ink-soft">
                <p>
                  Courier: <span className="font-medium text-ink">{latestShipment.courierName || 'Pending partner'}</span>
                </p>
                {latestShipment.awbCode && (
                  <div className="flex items-center gap-2">
                    <span>AWB:</span>
                    <span className="font-mono font-medium text-ink">{latestShipment.awbCode}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(latestShipment.awbCode!, 'awb')}
                      className="p-1 text-ink-soft hover:text-ink"
                      title="Copy AWB"
                    >
                      {copiedKey === 'awb' ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
                    </button>
                  </div>
                )}
                {latestShipment.trackingUrl && (
                  <a
                    href={latestShipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-teal hover:underline mt-1 font-medium"
                  >
                    Track on courier site <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </AdminDrawer>
  )
}
