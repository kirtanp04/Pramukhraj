import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  Package,
  User,
  MapPin,
  CreditCard,
  Copy,
  Check,
  Clock,
  ShieldAlert,
} from 'lucide-react'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { getApiErrorMessage } from '@/lib/apiClient'
import { formatDateTime, formatINR } from '@/lib/utils'
import { adminPaymentApi } from '@/services/adminPaymentApi'
import type { AdminPaymentDetail, AdminPaymentStatus } from '@/types/adminPayment'

interface AdminPaymentDrawerProps {
  paymentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

export function AdminPaymentDrawer({
  paymentId,
  open,
  onOpenChange,
}: AdminPaymentDrawerProps) {
  const [payment, setPayment] = useState<AdminPaymentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !paymentId) {
      setPayment(null)
      setError(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    adminPaymentApi
      .getById(paymentId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setPayment(data)
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
  }, [open, paymentId])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <AdminDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={payment ? `Payment ${payment.providerPaymentId || payment.id.slice(0, 8)}` : 'Payment Details'}
      description={payment ? `Order #${payment.orderNumber} • ${formatDateTime(payment.createdOn)}` : undefined}
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
                if (paymentId) {
                  setLoading(true)
                  setError(null)
                  adminPaymentApi
                    .getById(paymentId)
                    .then(setPayment)
                    .catch((err) => setError(getApiErrorMessage(err)))
                    .finally(() => setLoading(false))
                }
              },
            }}
          />
        </div>
      )}

      {payment && !loading && !error && (
        <div className="space-y-6 pb-6">
          {/* Header Amount & Status Card */}
          <div className="rounded-xl border bg-ivory-dim border-ink/10 bg-surface-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs! font-semibold uppercase tracking-wider text-ink-soft">
                  Payment Amount
                </span>
                <div className="mt-1 font-display text-2xl! font-bold text-ink">
                  {formatINR(payment.amount)}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs! text-ink-soft">
                  <Clock size={12} />
                  <span>
                    {payment.paidOn
                      ? `Paid on ${formatDateTime(payment.paidOn)}`
                      : `Created on ${formatDateTime(payment.createdOn)}`}
                  </span>
                </div>
              </div>
              <PaymentStatusBadge status={payment.status} />
            </div>

            {payment.lastError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-oxblood/20 bg-oxblood/5 p-3 text-xs! text-oxblood">
                <ShieldAlert size={16} className="shrink-0 text-oxblood mt-0.5" />
                <div>
                  <div className="font-semibold">Payment Issue / Error</div>
                  <div className="mt-0.5">{payment.lastError}</div>
                </div>
              </div>
            )}
          </div>

          {/* Gateway & Provider Identifiers */}
          <div className="rounded-xl border bg-ivory-dim border-ink/10 bg-surface-card p-4 space-y-3">
            <h3 className="flex items-center gap-2 font-display text-sm! font-bold text-ink">
              <CreditCard size={15} className="text-teal" />
              Gateway Credentials
            </h3>
            <div className="grid grid-cols-1 gap-2.5 text-xs!">
              <div className="flex items-center justify-between rounded-lg bg-ink/7 p-2.5 border border-ink/5">
                <span className="text-ink-soft">Razorpay Payment ID</span>
                <div className="flex items-center gap-1.5 font-mono font-medium text-ink">
                  <span>{payment.providerPaymentId || '—'}</span>
                  {payment.providerPaymentId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payment.providerPaymentId!, 'prov-pay')}
                      className="text-ink-soft hover:text-ink transition-colors p-1"
                      title="Copy Razorpay Payment ID"
                    >
                      {copiedKey === 'prov-pay' ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-ink/7 p-2.5 border border-ink/5">
                <span className="text-ink-soft">Razorpay Order ID</span>
                <div className="flex items-center gap-1.5 font-mono font-medium text-ink">
                  <span>{payment.providerOrderId || '—'}</span>
                  {payment.providerOrderId && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payment.providerOrderId!, 'prov-order')}
                      className="text-ink-soft hover:text-ink transition-colors p-1"
                      title="Copy Razorpay Order ID"
                    >
                      {copiedKey === 'prov-order' ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-ink/7 p-2.5 border border-ink/5">
                <span className="text-ink-soft">Internal Payment ID</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]! font-medium text-ink truncate max-w-56">
                  <span className="truncate">{payment.id}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(payment.id, 'pay-id')}
                    className="text-ink-soft hover:text-ink transition-colors p-1 shrink-0"
                    title="Copy Internal Payment ID"
                  >
                    {copiedKey === 'pay-id' ? <Check size={13} className="text-teal" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Linked Order Preview */}
          <div className="rounded-xl border bg-ivory-dim border-ink/10 bg-surface-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-sm! font-bold text-ink">
                <Package size={15} className="text-teal" />
                Linked Order
              </h3>
              <Link
                to={`/admin/orders/${payment.orderId}`}
                className="flex items-center gap-1 text-xs! font-medium text-teal hover:underline"
              >
                View Order #{payment.orderNumber}
                <ExternalLink size={12} />
              </Link>
            </div>

            <div className="flex bg-ink/7 items-center justify-between rounded-lg  p-3 border border-ink/5 text-xs!">
              <div>
                <div className="font-semibold text-ink">Order #{payment.orderNumber}</div>
                <div className="text-ink-soft">{payment.order.items.length} items • Grand Total: {formatINR(payment.order.grandTotal)}</div>
              </div>
              <OrderStatusBadge status={payment.order.status} />
            </div>

            {payment.order.items.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {payment.order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between  text-xs! py-1 border-b border-ink/5 last:border-0">
                    <div className="truncate pr-2">
                      <span className="font-medium text-ink">{item.productName}</span>
                      <span className="text-ink-soft"> ({item.variantName}) × {item.quantity}</span>
                    </div>
                    <span className="font-mono font-medium text-ink shrink-0">{formatINR(item.lineTotal)}</span>
                  </div>
                ))}
                {payment.order.items.length > 3 && (
                  <div className="text-center text-[11px]! text-ink-soft pt-1">
                    +{payment.order.items.length - 3} more items
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer Card */}
          <div className="rounded-xl border bg-ivory-dim border-ink/10 bg-surface-card p-4 space-y-2">
            <h3 className="flex items-center gap-2 font-display text-sm! font-bold text-ink">
              <User size={15} className="text-teal" />
              Customer Information
            </h3>
            <div className="rounded-lg bg-ink/7 p-3 border border-ink/5 text-xs! space-y-1">
              <div className="font-semibold text-ink">{payment.customer.fullName}</div>
              <div className="text-ink-soft">Mobile: {payment.customer.mobileNumber}</div>
              {payment.customer.email && <div className="text-ink-soft">Email: {payment.customer.email}</div>}
              {(payment.customer.city || payment.customer.state) && (
                <div className="flex items-center gap-1 text-ink-soft pt-1">
                  <MapPin size={12} />
                  <span>{[payment.customer.city, payment.customer.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gateway Transactions Audit History */}
          {payment.transactions.length > 0 && (
            <div className="rounded-xl border bg-ivory-dim border-ink/10 bg-surface-card p-4 space-y-3">
              <h3 className="font-display text-sm! font-bold text-ink">
                Transaction Audit Logs ({payment.transactions.length})
              </h3>
              <div className="space-y-2">
                {payment.transactions.map((tx) => (
                  <div key={tx.id} className="rounded-lg bg-ink/7 p-2.5 border border-ink/5 text-xs! space-y-1">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-ink">{tx.type}</span>
                      <span className="text-teal font-semibold">{tx.status}</span>
                    </div>
                    {tx.providerReference && (
                      <div className="font-mono text-[11px]! text-ink-soft">
                        Ref: {tx.providerReference}
                      </div>
                    )}
                    <div className="text-[10px]! text-ink-soft">
                      {formatDateTime(tx.createdOn)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detail Page Full Link Button */}
          <div className="pt-2">
            <Link
              to={`/admin/payments/${payment.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm! font-semibold text-white shadow-sm hover:bg-teal/90 transition-colors"
            >
              Open Full Payment Page
              <ExternalLink size={15} />
            </Link>
          </div>
        </div>
      )}
    </AdminDrawer>
  )
}

