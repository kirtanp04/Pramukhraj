import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  Package,
  Printer,
  RefreshCw,
  ShieldAlert,
  Truck,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { getApiErrorMessage } from '@/lib/apiClient'
import { formatDateTime, formatINR } from '@/lib/utils'
import { loadCustomerProductImage } from '@/services/customerProductImageLoader'
import { adminOrderApi } from '@/services/adminOrderApi'
import type {
  AdminOrderDetail,
  AdminOrderDetailItem,
} from '@/types/adminOrder'

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
    case 'AwbAssigned':
      return <Badge variant="turmeric">{status}</Badge>
    case 'DeliveryFailed':
    case 'RtoInitiated':
    case 'Cancelled':
      return <Badge variant="oxblood">{status}</Badge>
    default:
      return <Badge variant="soft">{status}</Badge>
  }
}

function ProductItemRow({ item }: { item: AdminOrderDetailItem }) {
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
    <tr className="border-b border-ink/5 last:border-0 hover:bg-ivory/50">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink/5 border border-ink/10 flex items-center justify-center">
            {imageUrl ? (
              <img src={imageUrl} alt={item.productName} className="h-full w-full object-cover" />
            ) : (
              <Package size={20} className="text-ink-soft/40" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm! font-medium text-ink">{item.productName}</p>
            <p className="text-xs! text-ink-soft">
              {item.variantName ? `${item.variantName} · ` : ''}
              {item.weight} {item.weightUnit}
            </p>
            <p className="font-mono text-[11px]! text-ink-soft/70">
              SKU: {item.sku || '—'} {item.hsnCode ? `· HSN: ${item.hsnCode}` : ''}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-center font-mono text-xs! text-ink">{item.quantity}</td>
      <td className="py-3 px-4 text-right font-mono text-xs! text-ink">
        <div>{formatINR(item.unitPrice)}</div>
        {item.unitMrp > item.unitPrice && (
          <div className="text-[11px]! text-ink-soft line-through">{formatINR(item.unitMrp)}</div>
        )}
      </td>
      <td className="py-3 px-4 text-right font-mono text-xs! text-ink-soft">
        {item.taxPercentage}% ({formatINR(item.taxAmount)})
      </td>
      <td className="py-3 px-4 text-right font-mono text-sm! font-bold text-oxblood">
        {formatINR(item.lineTotal)}
      </td>
    </tr>
  )
}

export function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const loadOrderDetail = () => {
    if (!orderId) return
    setIsLoading(true)
    setError(null)

    adminOrderApi
      .getById(orderId)
      .then((data) => setOrder(data))
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadOrderDetail()
  }, [orderId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="py-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/orders')}
          className="mb-4 flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back to Orders
        </Button>
        <ServerError
          message={error ?? 'Order could not be loaded.'}
          action={{ label: 'Retry', onClick: loadOrderDetail }}
        />
      </div>
    )
  }

  const latestPayment = order.payments[0] ?? null
  const latestShipment = order.shipments[0] ?? null

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/orders')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink-soft hover:bg-ink/5 hover:text-ink transition-colors"
            title="Back to Orders"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl! font-bold text-ink">
                Order #{order.orderNumber}
              </h1>
              <button
                type="button"
                onClick={() => copyToClipboard(order.orderNumber, 'order-number')}
                className="p-1 text-ink-soft hover:text-ink rounded"
                title="Copy order number"
              >
                {copiedKey === 'order-number' ? (
                  <Check size={14} className="text-teal" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
            <p className="flex items-center gap-2 text-xs! text-ink-soft mt-0.5">
              <Calendar size={13} />
              Placed on {formatDateTime(order.createdOn)} · Updated {formatDateTime(order.updatedOn)}
            </p>
          </div>
        </div>

        {/* Status Badges Group */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-ivory-dim px-3 py-1.5 border border-ink/5">
            <span className="text-[11px]! font-medium text-ink-soft">Order:</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-ivory-dim px-3 py-1.5 border border-ink/5">
            <span className="text-[11px]! font-medium text-ink-soft">Payment:</span>
            <PaymentStatusBadge status={latestPayment?.status ?? 'Pending'} />
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-ivory-dim px-3 py-1.5 border border-ink/5">
            <span className="text-[11px]! font-medium text-ink-soft">Shipment:</span>
            <ShipmentStatusBadge status={latestShipment?.status ?? null} />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrderDetail}
            className="flex items-center gap-1.5"
            title="Refresh order data"
          >
            <RefreshCw size={13} />
          </Button>
        </div>
      </div>

      {/* Customer Note Warning (if present) */}
      {order.customerNote && (
        <div className="rounded-2xl border border-turmeric/40 bg-turmeric/10 p-4">
          <div className="flex items-start gap-2.5">
            <FileText size={18} className="text-turmeric-deep shrink-0 mt-0.5" />
            <div>
              <p className="text-xs! uppercase tracking-wider font-semibold text-turmeric-deep">
                Special Delivery Instruction / Customer Note
              </p>
              <p className="mt-1 text-sm! text-ink italic leading-relaxed">
                "{order.customerNote}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Items, Financial Breakdown, Payment Audit, Shipment Tracking) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Order Items */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-ink/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={17} className="text-teal" />
                <h2 className="font-semibold text-base! text-ink">
                  Ordered Products ({order.items.reduce((s, i) => s + i.quantity, 0)})
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-ink/5 bg-ink/2 text-[11px]! font-semibold uppercase tracking-wider text-ink-soft">
                    <th className="py-2.5 px-4">Item Details</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Price</th>
                    <th className="py-2.5 px-4 text-right">GST (Tax)</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <ProductItemRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card: Financial Summary & Taxes */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5">
            <h2 className="font-semibold text-base! text-ink mb-4 flex items-center gap-2">
              <FileText size={17} className="text-teal" /> Financial & Tax Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tax Details */}
              <div className="space-y-2 rounded-xl bg-ivory p-3.5 border border-ink/5 text-xs! text-ink-soft">
                <p className="font-semibold text-ink uppercase tracking-wider text-[11px]!">
                  GST Breakdown
                </p>
                <div className="flex justify-between">
                  <span>Product GST ({order.productTaxRatePercent}% avg)</span>
                  <span className="font-mono text-ink">{formatINR(order.productTaxAmount)}</span>
                </div>
                {order.paymentServiceTaxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Payment Gateway GST ({order.paymentServiceTaxRatePercent}%)</span>
                    <span className="font-mono text-ink">
                      {formatINR(order.paymentServiceTaxAmount)}
                    </span>
                  </div>
                )}
                <div className="border-t border-ink/5 pt-1.5 flex justify-between font-semibold text-ink">
                  <span>Total Tax Included</span>
                  <span className="font-mono">{formatINR(order.taxAmount)}</span>
                </div>
              </div>

              {/* Amount Math */}
              <div className="space-y-2.5 text-sm! text-ink-soft">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-ink">{formatINR(order.subtotal)}</span>
                </div>

                {order.itemDiscountAmount > 0 && (
                  <div className="flex justify-between text-teal">
                    <span>Product Catalog Discounts</span>
                    <span className="font-mono">-{formatINR(order.itemDiscountAmount)}</span>
                  </div>
                )}

                {order.couponDiscountAmount > 0 && (
                  <div className="flex justify-between text-teal font-medium">
                    <span>Coupon ({order.couponCode || 'Voucher'})</span>
                    <span className="font-mono">-{formatINR(order.couponDiscountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <div>
                    <span>Shipping Charges</span>
                    {order.providerShippingCost > 0 && (
                      <span className="block text-[11px]! text-ink-soft/70">
                        (Courier quote: {formatINR(order.providerShippingCost)})
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-ink">
                    {order.shippingAmount > 0 ? formatINR(order.shippingAmount) : 'Free'}
                  </span>
                </div>

                <div className="border-t border-ink/10 pt-3 flex justify-between items-baseline font-bold text-ink">
                  <span className="text-base!">Grand Total</span>
                  <span className="font-mono text-xl! text-oxblood font-bold">
                    {formatINR(order.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Payment Information (Razorpay) */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard size={17} className="text-teal" />
                <h2 className="font-semibold text-base! text-ink">Payment & Gateway Details</h2>
              </div>
              <PaymentStatusBadge status={latestPayment?.status ?? 'Pending'} />
            </div>

            {latestPayment ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs!">
                  <div className="rounded-xl bg-ivory p-3 border border-ink/5">
                    <p className="text-ink-soft text-[11px]! mb-1">Razorpay Order ID</p>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-medium text-ink truncate">
                        {latestPayment.providerOrderId || '—'}
                      </span>
                      {latestPayment.providerOrderId && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(latestPayment.providerOrderId!, 'rzp-order')}
                          className="p-0.5 text-ink-soft hover:text-ink"
                        >
                          {copiedKey === 'rzp-order' ? (
                            <Check size={12} className="text-teal" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-ivory p-3 border border-ink/5">
                    <p className="text-ink-soft text-[11px]! mb-1">Razorpay Payment ID</p>
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-medium text-ink truncate">
                        {latestPayment.providerPaymentId || 'Pending capture'}
                      </span>
                      {latestPayment.providerPaymentId && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(latestPayment.providerPaymentId!, 'rzp-pay')}
                          className="p-0.5 text-ink-soft hover:text-ink"
                        >
                          {copiedKey === 'rzp-pay' ? (
                            <Check size={12} className="text-teal" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-ivory p-3 border border-ink/5">
                    <p className="text-ink-soft text-[11px]! mb-1">Amount Paid</p>
                    <p className="font-mono font-bold text-ink">
                      {formatINR(latestPayment.amountInr)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-ivory p-3 border border-ink/5">
                    <p className="text-ink-soft text-[11px]! mb-1">Paid At</p>
                    <p className="font-mono text-ink truncate">
                      {latestPayment.paidOn ? formatDateTime(latestPayment.paidOn) : 'Awaiting'}
                    </p>
                  </div>
                </div>

                {latestPayment.lastError && (
                  <div className="rounded-xl border border-oxblood/30 bg-oxblood/10 p-3 text-xs! text-oxblood flex items-start gap-2">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Gateway Error:</p>
                      <p>{latestPayment.lastError}</p>
                    </div>
                  </div>
                )}

                {/* Payment Transaction Logs */}
                {latestPayment.transactions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs! uppercase tracking-wider font-semibold text-ink-soft mb-2">
                      Transaction Activity Logs ({latestPayment.transactions.length})
                    </p>
                    <div className="space-y-1.5">
                      {latestPayment.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-lg bg-ivory p-2.5 text-xs! border border-ink/5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-ink">{tx.type}</span>
                            {tx.providerReference && (
                              <span className="text-ink-soft">({tx.providerReference})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="soft">{tx.status}</Badge>
                            <span className="font-mono text-[11px]! text-ink-soft">
                              {formatDateTime(tx.createdOn)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs! text-ink-soft italic">No payment record associated with this order.</p>
            )}
          </div>

          {/* Card: Shipment Fulfillment & Milestones (Shiprocket) */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Truck size={17} className="text-teal" />
                <h2 className="font-semibold text-base! text-ink">Fulfillment & Shipment Tracking</h2>
              </div>
              <ShipmentStatusBadge status={latestShipment?.status ?? null} />
            </div>

            {latestShipment ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs!">
                  <div className="rounded-xl bg-ivory p-3 border border-ink/5">
                    <p className="text-ink-soft text-[11px]! mb-1">Courier Partner</p>
                    <p className="font-semibold text-ink">
                      {latestShipment.courierName || 'Courier assignment pending'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-ivory p-3 border border-ink/5">
                    <p className="text-ink-soft text-[11px]! mb-1">AWB Tracking Code</p>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-ink">
                        {latestShipment.awbCode || 'Pending generation'}
                      </span>
                      {latestShipment.awbCode && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(latestShipment.awbCode!, 'awb-detail')}
                          className="p-0.5 text-ink-soft hover:text-ink"
                        >
                          {copiedKey === 'awb-detail' ? (
                            <Check size={12} className="text-teal" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-ivory p-3 border border-ink/5">
                    <p className="text-ink-soft text-[11px]! mb-1">Estimated Delivery</p>
                    <p className="font-medium text-ink">
                      {latestShipment.estimatedDeliveryOn
                        ? formatDateTime(latestShipment.estimatedDeliveryOn)
                        : 'Standard shipping'}
                    </p>
                  </div>
                </div>

                {/* Links for Label, Manifest, Tracking */}
                <div className="flex flex-wrap gap-2">
                  {latestShipment.trackingUrl && (
                    <a
                      href={latestShipment.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ivory px-3 py-2 text-xs! font-medium text-teal border border-ink/10 hover:bg-ivory-dim transition-colors"
                    >
                      <ExternalLink size={13} /> Live Tracking URL
                    </a>
                  )}
                  {latestShipment.labelUrl && (
                    <a
                      href={latestShipment.labelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ivory px-3 py-2 text-xs! font-medium text-ink border border-ink/10 hover:bg-ivory-dim transition-colors"
                    >
                      <Printer size={13} /> Print Shipping Label
                    </a>
                  )}
                  {latestShipment.manifestUrl && (
                    <a
                      href={latestShipment.manifestUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ivory px-3 py-2 text-xs! font-medium text-ink border border-ink/10 hover:bg-ivory-dim transition-colors"
                    >
                      <Download size={13} /> Download Manifest
                    </a>
                  )}
                </div>

                {latestShipment.lastError && (
                  <div className="rounded-xl border border-oxblood/30 bg-oxblood/10 p-3 text-xs! text-oxblood">
                    <p className="font-semibold">Shiprocket Dispatch Error:</p>
                    <p>{latestShipment.lastError}</p>
                  </div>
                )}

                {/* Milestone Activities Stream */}
                <div>
                  <p className="text-xs! uppercase tracking-wider font-semibold text-ink-soft mb-3">
                    Shipment Milestones & Activity Scans ({latestShipment.activities.length})
                  </p>
                  {latestShipment.activities.length > 0 ? (
                    <div className="space-y-2.5 border-l-2 border-teal/30 ml-2 pl-4">
                      {latestShipment.activities.map((act) => (
                        <div key={act.id} className="relative">
                          <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-teal" />
                          <div className="rounded-lg bg-ivory p-2.5 border border-ink/5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs! font-semibold text-ink">{act.activity}</p>
                              <span className="font-mono text-[11px]! text-ink-soft">
                                {formatDateTime(act.date)}
                              </span>
                            </div>
                            <p className="text-[11px]! text-ink-soft mt-0.5">
                              {act.location ? `Location: ${act.location}` : ''}{' '}
                              {act.status ? `· Status: ${act.status}` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs! text-ink-soft italic">
                      No courier activity scans received yet.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs! text-ink-soft italic">
                Fulfillment has not been triggered for this order yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (Customer Profile, Addresses, Order Status History, Reservations) */}
        <div className="space-y-6">
          {/* Card: Customer Profile */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User size={17} className="text-teal" />
                <h2 className="font-semibold text-base! text-ink">Customer</h2>
              </div>
              {order.customer.isBlocked && <Badge variant="oxblood">Blocked</Badge>}
            </div>

            <div className="space-y-2 text-xs!">
              <p className="text-sm! font-semibold text-ink">{order.customer.fullName}</p>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Mobile:</span>
                <a
                  href={`tel:${order.customer.mobileNumber}`}
                  className="font-mono font-medium text-teal hover:underline"
                >
                  {order.customer.mobileNumber}
                </a>
              </div>
              {order.customer.email && (
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">Email:</span>
                  <a
                    href={`mailto:${order.customer.email}`}
                    className="font-medium text-teal hover:underline truncate max-w-44"
                  >
                    {order.customer.email}
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-ink/5">
                <span className="text-ink-soft">Verification:</span>
                <div className="flex gap-1">
                  <Badge variant={order.customer.isMobileVerified ? 'teal' : 'soft'}>
                    Mobile
                  </Badge>
                  <Badge variant={order.customer.isEmailVerified ? 'teal' : 'soft'}>Email</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Shipping Address */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={17} className="text-teal" />
              <h2 className="font-semibold text-base! text-ink">Shipping Address</h2>
            </div>
            {order.shippingAddress ? (
              <div className="space-y-1 text-xs! text-ink-soft leading-relaxed">
                <p className="font-semibold text-sm! text-ink">
                  {order.shippingAddress.recipientName}
                </p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                {order.shippingAddress.landmark && <p>Landmark: {order.shippingAddress.landmark}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                  <span className="font-mono font-medium text-ink">
                    {order.shippingAddress.postalCode}
                  </span>
                </p>
                <p className="pt-1 font-mono text-ink">Ph: {order.shippingAddress.mobileNumber}</p>
              </div>
            ) : (
              <p className="text-xs! text-ink-soft italic">No shipping address recorded.</p>
            )}
          </div>

          {/* Card: Billing Address */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={17} className="text-teal" />
              <h2 className="font-semibold text-base! text-ink">Billing Address</h2>
            </div>
            {order.billingAddress ? (
              <div className="space-y-1 text-xs! text-ink-soft leading-relaxed">
                <p className="font-semibold text-sm! text-ink">
                  {order.billingAddress.recipientName}
                </p>
                <p>{order.billingAddress.addressLine1}</p>
                {order.billingAddress.addressLine2 && <p>{order.billingAddress.addressLine2}</p>}
                {order.billingAddress.landmark && <p>Landmark: {order.billingAddress.landmark}</p>}
                <p>
                  {order.billingAddress.city}, {order.billingAddress.state} -{' '}
                  <span className="font-mono font-medium text-ink">
                    {order.billingAddress.postalCode}
                  </span>
                </p>
                <p className="pt-1 font-mono text-ink">Ph: {order.billingAddress.mobileNumber}</p>
              </div>
            ) : (
              <p className="text-xs! text-ink-soft italic">Same as shipping address.</p>
            )}
          </div>

          {/* Card: Inventory Reservations */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={17} className="text-teal" />
              <h2 className="font-semibold text-base! text-ink">Stock Reservations</h2>
            </div>
            {order.inventoryReservations.length > 0 ? (
              <div className="space-y-2">
                {order.inventoryReservations.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-lg bg-ivory p-2.5 text-xs! border border-ink/5"
                  >
                    <div>
                      <p className="font-medium text-ink">Qty: {res.quantity}</p>
                      <p className="text-[10px]! font-mono text-ink-soft">
                        Expires: {formatDateTime(res.expiresOn)}
                      </p>
                    </div>
                    <Badge variant={res.status === 'Completed' ? 'teal' : 'soft'}>
                      {res.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs! text-ink-soft italic">No active reservation record.</p>
            )}
          </div>

          {/* Card: Order Status History */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5">
            <h2 className="font-semibold text-base! text-ink mb-3 flex items-center gap-2">
              <FileText size={17} className="text-teal" /> Status History Log
            </h2>
            {order.statusHistory.length > 0 ? (
              <div className="space-y-2">
                {order.statusHistory.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-lg bg-ivory p-2.5 text-xs! border border-ink/5"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <OrderStatusBadge status={h.status} />
                      <span className="font-mono text-[10px]! text-ink-soft">
                        {formatDateTime(h.createdOn)}
                      </span>
                    </div>
                    {h.note && <p className="text-[11px]! text-ink-soft">{h.note}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs! text-ink-soft italic">No status audit history recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
