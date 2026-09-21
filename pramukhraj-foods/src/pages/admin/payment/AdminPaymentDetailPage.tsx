import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  MapPin,
  Package,
  RefreshCw,
  ShieldAlert,
  Truck,
  User,
  CheckCircle2,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { getApiErrorMessage } from '@/lib/apiClient'
import { formatDateTime, formatINR } from '@/lib/utils'
import { adminPaymentApi } from '@/services/adminPaymentApi'
import type {
  AdminPaymentDetail,
  AdminPaymentStatus,
} from '@/types/adminPayment'

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

export function AdminPaymentDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const navigate = useNavigate()

  const [payment, setPayment] = useState<AdminPaymentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const fetchDetail = () => {
    if (!paymentId) return
    setLoading(true)
    setError(null)
    adminPaymentApi
      .getById(paymentId)
      .then(setPayment)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDetail()
  }, [paymentId])

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="py-8">
        <ServerError
          className="h-auto min-h-96 py-16"
          message={error || 'Payment not found'}
          action={{ label: 'Retry', onClick: fetchDetail }}
        />
      </div>
    )
  }

  const order = payment.order
  const customer = payment.customer

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/payments')}
            className="h-9 w-9 p-0"
            title="Back to Payments"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl! font-bold text-ink">
                Payment #{payment.providerPaymentId || payment.id.slice(0, 8)}
              </h1>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs! text-ink-soft">
              <span>Created on {formatDateTime(payment.createdOn)}</span>
              <span>•</span>
              <Link
                to={`/admin/orders/${payment.orderId}`}
                className="font-mono font-semibold text-teal hover:underline flex items-center gap-1"
              >
                Order #{payment.orderNumber}
                <ExternalLink size={11} />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDetail}
            className="flex items-center gap-1.5 text-xs!"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Diagnostics / Error Alert */}
      {payment.lastError && (
        <div className="flex items-start gap-3 rounded-xl border border-oxblood/20 bg-oxblood/5 p-4 text-xs! text-oxblood">
          <ShieldAlert size={18} className="shrink-0 text-oxblood mt-0.5" />
          <div>
            <div className="font-bold text-sm!">Gateway Notice / Failure Reason</div>
            <div className="mt-1">{payment.lastError}</div>
          </div>
        </div>
      )}

      {/* Metric 4-Card Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-4">
          <div className="flex items-center gap-1.5 text-xs! font-semibold text-ink-soft">
            <CreditCard size={14} />
            <span>Amount Paid</span>
          </div>
          <div className="mt-2 font-display text-2xl! font-bold text-ink">
            {formatINR(payment.amount)}
          </div>
          <div className="mt-0.5 text-[11px]! font-mono text-ink-soft">
            {payment.currency} ({payment.amountPaise} paise)
          </div>
        </div>

        <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-4">
          <div className="flex items-center gap-1.5 text-xs! font-semibold text-ink-soft">
            <CheckCircle2 size={14} />
            <span>Gateway ID</span>
          </div>
          <div className="mt-2 font-mono text-base! font-bold text-ink truncate flex items-center justify-between">
            <span className="truncate">{payment.providerPaymentId || '—'}</span>
            {payment.providerPaymentId && (
              <button
                type="button"
                onClick={() => copyToClipboard(payment.providerPaymentId!, 'prov-pay')}
                className="text-ink-soft hover:text-ink transition-colors p-1"
                title="Copy Razorpay Payment ID"
              >
                {copiedKey === 'prov-pay' ? <Check size={14} className="text-teal" /> : <Copy size={14} />}
              </button>
            )}
          </div>
          <div className="mt-0.5 text-[11px]! text-ink-soft">Razorpay Payment ID</div>
        </div>

        <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-4">
          <div className="flex items-center gap-1.5 text-xs! font-semibold text-ink-soft">
            <Package size={14} />
            <span>Linked Order</span>
          </div>
          <div className="mt-2 font-mono text-base! font-bold text-teal truncate">
            <Link to={`/admin/orders/${payment.orderId}`} className="hover:underline flex items-center gap-1">
              #{payment.orderNumber}
              <ExternalLink size={13} />
            </Link>
          </div>
          <div className="mt-0.5 text-[11px]! text-ink-soft">
            Status: {order.status}
          </div>
        </div>

        <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-4">
          <div className="flex items-center gap-1.5 text-xs! font-semibold text-ink-soft">
            <Clock size={14} />
            <span>Captured Time</span>
          </div>
          <div className="mt-2 font-display text-sm! font-bold text-ink">
            {payment.paidOn ? formatDateTime(payment.paidOn) : 'Not yet paid'}
          </div>
          <div className="mt-0.5 text-[11px]! text-ink-soft">
            {payment.paidOn ? 'Verified & captured' : 'Awaiting payment confirmation'}
          </div>
        </div>
      </div>

      {/* Main Content Split: Left details & Right sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Transactions Audit & Order Items) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Gateway Transactions Audit Table */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base! font-bold text-ink flex items-center gap-2">
                <FileText size={16} className="text-teal" />
                Gateway Transaction Audit Logs ({payment.transactions.length})
              </h2>
            </div>

            {payment.transactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink/15 bg-ivory p-6 text-center text-xs! text-ink-soft">
                No intermediate transaction logs recorded for this payment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs!">
                  <thead>
                    <tr className="border-b border-ink/10 text-[11px]! font-semibold text-ink-soft">
                      <th className="py-2.5 pr-4">Type</th>
                      <th className="py-2.5 px-4">Gateway Reference</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Payload / Note</th>
                      <th className="py-2.5 pl-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {payment.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-ivory/50 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-ink">{tx.type}</td>
                        <td className="py-3 px-4 font-mono text-[11px]! text-ink-soft">
                          {tx.providerReference || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px]! font-medium text-teal">
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-[200px] truncate font-mono text-[10px]! text-ink-soft" title={tx.safePayloadJson || ''}>
                          {tx.safePayloadJson || '—'}
                        </td>
                        <td className="py-3 pl-4 text-right text-ink-soft text-[11px]!">
                          {formatDateTime(tx.createdOn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Linked Order Items */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base! font-bold text-ink flex items-center gap-2">
                <Package size={16} className="text-teal" />
                Order Line Items ({order.items.length})
              </h2>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs!">
                <thead>
                  <tr className="border-b border-ink/10 text-[11px]! font-semibold text-ink-soft">
                    <th className="py-2.5 pr-4">Product</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Tax</th>
                    <th className="py-2.5 pl-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-ivory/50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-ink">{item.productName}</div>
                        <div className="text-[11px]! text-ink-soft">
                          {item.variantName} • {item.weight} {item.weightUnit} • SKU: {item.sku}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatINR(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-right font-mono text-ink-soft">
                        {formatINR(item.taxAmount)} ({item.taxPercentage}%)
                      </td>
                      <td className="py-3 pl-4 text-right font-mono font-bold text-ink">
                        {formatINR(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Breakdown */}
            <div className="border-t border-ink/10 pt-4 flex flex-col items-end text-xs! space-y-1.5">
              <div className="flex w-64 justify-between text-ink-soft">
                <span>Subtotal:</span>
                <span className="font-mono">{formatINR(order.subtotal)}</span>
              </div>
              {order.itemDiscountAmount > 0 && (
                <div className="flex w-64 justify-between text-oxblood">
                  <span>Item Discount:</span>
                  <span className="font-mono">-{formatINR(order.itemDiscountAmount)}</span>
                </div>
              )}
              {order.couponDiscountAmount > 0 && (
                <div className="flex w-64 justify-between text-oxblood">
                  <span>Coupon ({order.couponCode}):</span>
                  <span className="font-mono">-{formatINR(order.couponDiscountAmount)}</span>
                </div>
              )}
              <div className="flex w-64 justify-between text-ink-soft">
                <span>Shipping Charges:</span>
                <span className="font-mono">{formatINR(order.shippingAmount)}</span>
              </div>
              <div className="flex w-64 justify-between text-ink-soft">
                <span>Taxes & GST:</span>
                <span className="font-mono">{formatINR(order.taxAmount)}</span>
              </div>
              <div className="flex w-64 justify-between border-t border-ink/10 pt-2 font-display text-base! font-bold text-ink">
                <span>Grand Total:</span>
                <span className="font-mono text-teal">{formatINR(order.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Customer, Identifiers & Address Cards) */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5 space-y-3">
            <h2 className="font-display text-sm! font-bold text-ink flex items-center gap-2">
              <User size={15} className="text-teal" />
              Customer Details
            </h2>
            <div className="space-y-2 text-xs!">
              <div className="font-semibold text-ink text-sm!">{customer.fullName}</div>
              <div className="text-ink-soft">Mobile: <span className="font-medium text-ink">{customer.mobileNumber}</span></div>
              {customer.email && <div className="text-ink-soft">Email: <span className="font-medium text-ink">{customer.email}</span></div>}
              {(customer.city || customer.state) && (
                <div className="text-ink-soft flex items-center gap-1 pt-1">
                  <MapPin size={13} />
                  <span>{[customer.city, customer.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {customer.isBlocked && (
                <div className="mt-2 rounded-lg bg-oxblood/10 p-2 text-oxblood font-semibold">
                  Customer account is blocked
                </div>
              )}
            </div>
          </div>

          {/* Payment Identifiers & Audit Metas */}
          <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5 space-y-3">
            <h2 className="font-display text-sm! font-bold text-ink flex items-center gap-2">
              <CreditCard size={15} className="text-teal" />
              Payment Identifiers
            </h2>
            <div className="space-y-2.5 text-xs!">
              <div className="flex items-center justify-between rounded-xl bg-ivory p-2.5 border border-ink/5">
                <span className="text-ink-soft">Razorpay Order ID</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]! font-medium text-ink">
                  <span>{payment.providerOrderId || '—'}</span>
                  {payment.providerOrderId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payment.providerOrderId!, 'prov-order')}
                      className="text-ink-soft hover:text-ink p-0.5"
                      title="Copy"
                    >
                      {copiedKey === 'prov-order' ? <Check size={12} className="text-teal" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-ivory p-2.5 border border-ink/5">
                <span className="text-ink-soft">Razorpay Payment ID</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]! font-medium text-ink">
                  <span>{payment.providerPaymentId || '—'}</span>
                  {payment.providerPaymentId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payment.providerPaymentId!, 'prov-pay-meta')}
                      className="text-ink-soft hover:text-ink p-0.5"
                      title="Copy"
                    >
                      {copiedKey === 'prov-pay-meta' ? <Check size={12} className="text-teal" /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-ivory p-2.5 border border-ink/5">
                <span className="text-ink-soft">Idempotency Key</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]! font-medium text-ink truncate max-w-44">
                  <span className="truncate">{payment.idempotencyKey}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(payment.idempotencyKey, 'idem-key')}
                    className="text-ink-soft hover:text-ink p-0.5 shrink-0"
                    title="Copy"
                  >
                    {copiedKey === 'idem-key' ? <Check size={12} className="text-teal" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 text-[11px]! text-ink-soft space-y-1">
                <div>Created: {formatDateTime(payment.createdOn)}</div>
                <div>Updated: {formatDateTime(payment.updatedOn)}</div>
                <div>Expires: {formatDateTime(payment.expiresOn)}</div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5 space-y-2">
              <h2 className="font-display text-sm! font-bold text-ink flex items-center gap-2">
                <MapPin size={15} className="text-teal" />
                Shipping Destination
              </h2>
              <div className="rounded-xl bg-ivory p-3.5 border border-ink/5 text-xs! text-ink-soft space-y-0.5">
                <div className="font-semibold text-ink">{order.shippingAddress.recipientName}</div>
                <div>{order.shippingAddress.mobileNumber}</div>
                <div>{order.shippingAddress.addressLine1}</div>
                {order.shippingAddress.addressLine2 && <div>{order.shippingAddress.addressLine2}</div>}
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                </div>
                <div>{order.shippingAddress.country}</div>
              </div>
            </div>
          )}

          {/* Shipment Preview (if fulfilled) */}
          {payment.shipment && (
            <div className="rounded-2xl bg-ivory-dim border border-ink/10 p-5 space-y-3">
              <h2 className="font-display text-sm! font-bold text-ink flex items-center gap-2">
                <Truck size={15} className="text-teal" />
                Shipment Information
              </h2>
              <div className="space-y-1.5 text-xs!">
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">Status:</span>
                  <Badge variant="teal">{payment.shipment.status}</Badge>
                </div>
                {payment.shipment.courierName && (
                  <div className="flex items-center justify-between text-ink-soft">
                    <span>Courier:</span>
                    <span className="font-medium text-ink">{payment.shipment.courierName}</span>
                  </div>
                )}
                {payment.shipment.awbCode && (
                  <div className="flex items-center justify-between text-ink-soft">
                    <span>AWB:</span>
                    <span className="font-mono font-medium text-ink">{payment.shipment.awbCode}</span>
                  </div>
                )}
                {payment.shipment.trackingUrl && (
                  <a
                    href={payment.shipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-teal/20 bg-teal/5 py-2 text-xs! font-medium text-teal hover:bg-teal/10 transition-colors"
                  >
                    <span>Track on Courier Site</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

