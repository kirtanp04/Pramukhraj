import { CreditCard, ShieldCheck, Tag } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { CustomerOrderDetail } from "../types/order.types";

interface OrderPaymentSummaryProps {
  order: CustomerOrderDetail;
}

export function OrderPaymentSummary({ order }: OrderPaymentSummaryProps) {
  const isPaid = order.paymentStatus.toLowerCase() === "paid";
  const isFailed = order.paymentStatus.toLowerCase() === "failed";
  const isPending = order.paymentStatus.toLowerCase() === "pending";

  return (
    <div className="rounded-2xl border border-ink/10 bg-ivory p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-ink/10 pb-4">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-oxblood" />
          <h4 className="font-display font-medium text-ink text-base!">Payment Summary</h4>
        </div>
        <Badge
          variant={
            isPaid
              ? "success"
              : isFailed
              ? "oxblood"
              : isPending
              ? "turmeric"
              : "soft"
          }
        >
          {order.paymentStatus}
        </Badge>
      </div>

      <div className="space-y-2.5 text-xs! sm:text-sm!">
        <div className="flex items-center justify-between text-ink-soft">
          <span>Items Subtotal:</span>
          <span className="font-mono text-ink">{formatINR(order.subtotal)}</span>
        </div>

        {order.itemDiscountAmount > 0 && (
          <div className="flex items-center justify-between text-emerald-700">
            <span>Product Discount:</span>
            <span className="font-mono">- {formatINR(order.itemDiscountAmount)}</span>
          </div>
        )}

        {order.couponDiscountAmount > 0 && (
          <div className="flex items-center justify-between text-emerald-700">
            <span className="flex items-center gap-1">
              <Tag size={13} />
              <span>Coupon Discount {order.couponCode && `(${order.couponCode})`}:</span>
            </span>
            <span className="font-mono">- {formatINR(order.couponDiscountAmount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-ink-soft">
          <span>Shipping Charges:</span>
          <span className="font-mono text-ink">
            {order.customerShippingAmount === 0 ? (
              <span className="font-medium text-emerald-700">FREE</span>
            ) : (
              formatINR(order.customerShippingAmount)
            )}
          </span>
        </div>

        {order.taxAmount > 0 && (
          <div className="space-y-1 border-t border-ink/5 pt-2">
            <div className="flex items-center justify-between text-ink-soft">
              <span>GST / Taxes:</span>
              <span className="font-mono text-ink">{formatINR(order.taxAmount)}</span>
            </div>
            {(order.productTaxAmount > 0 || order.paymentServiceTaxAmount > 0) && (
              <div className="space-y-0.5 pl-2 text-[11px]! text-ink-soft/80">
                {order.productTaxAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Product GST ({order.productTaxRatePercent}%):</span>
                    <span className="font-mono">{formatINR(order.productTaxAmount)}</span>
                  </div>
                )}
                {order.paymentServiceTaxAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span>Payment & Processing GST ({order.paymentServiceTaxRatePercent}%):</span>
                    <span className="font-mono">{formatINR(order.paymentServiceTaxAmount)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-ink/10 pt-3 flex items-center justify-between font-semibold text-ink text-sm! sm:text-base!">
          <span>Grand Total:</span>
          <span className="font-mono text-oxblood text-base! sm:text-lg!">
            {formatINR(order.grandTotal)}
          </span>
        </div>
      </div>

      {/* Payment Method Details */}
      <div className="rounded-xl bg-ivory-dim p-3.5 space-y-1.5 text-xs!">
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">Payment Method:</span>
          <span className="font-medium text-ink">Prepaid Online (Razorpay)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-soft">Fulfillment Partner:</span>
          <span className="font-medium text-ink">{order.storeName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]! text-ink-soft/90 pt-1">
          <ShieldCheck size={13} className="text-emerald-700" />
          <span>100% Secure Transaction & Fraud Prevention</span>
        </div>
      </div>
    </div>
  );
}
