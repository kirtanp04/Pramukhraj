import { Link } from "react-router-dom";
import { FileCheck, ArrowRight, ShoppingBag, RefreshCw, ShieldCheck } from "lucide-react";
import { formatINR, formatDateTime, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCustomerOrders } from "@/features/orders/hooks/useCustomerOrders";

export function AccountInvoices() {
  const { orders, isLoading, error, reload } = useCustomerOrders("all", 1, 50);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <h2 className="font-display font-medium text-ink text-xl! sm:text-2xl!">
            Receipts & Bills of Supply
          </h2>
          <p className="text-xs! sm:text-sm! text-ink-soft mt-1">
            Official order receipts for your completed purchases. All prices are inclusive of all taxes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={reload}
          disabled={isLoading}
          className="gap-1.5"
        >
          <RefreshCw size={13} className={cn(isLoading && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Compliance / Legal Framework Callout */}
      <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 text-xs! text-teal flex items-start gap-3">
        <ShieldCheck size={18} className="shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold uppercase tracking-wider text-[11px]!">
            GST Compliance & Invoicing Information
          </p>
          <p className="text-teal/90 leading-relaxed">
            As an unregistered supplier under Section 32 of the CGST Act, 2017, Pramukhraj Foods supplies all goods on an <strong>all-inclusive pricing basis</strong>. In accordance with Rule 49 of the CGST Rules, a <strong>Bill of Supply / Order Receipt</strong> is issued in lieu of a tax invoice.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-ink/5 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-6 text-center text-oxblood space-y-3">
          <p className="text-sm! font-medium">{error}</p>
          <Button variant="outline" size="sm" onClick={reload}>Retry</Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink/20 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <FileCheck size={36} className="text-ink-soft" />
          <h3 className="font-display font-medium text-base! text-ink">No receipts found</h3>
          <p className="text-xs! text-ink-soft max-w-sm">
            Once you place an order, your official Bill of Supply receipt will be generated and available here for viewing or printing.
          </p>
          <Button asChild size="sm" className="mt-2">
            <Link to="/products">
              <ShoppingBag size={14} className="mr-1.5" />
              Explore Products
            </Link>
          </Button>
        </div>
      )}

      {/* Orders List */}
      {!isLoading && !error && orders.length > 0 && (
        <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-ivory shadow-xs overflow-hidden">
          {orders.map((order) => {
            const isPaid = order.paymentStatus.toLowerCase() === "paid";
            return (
              <div
                key={order.orderId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 hover:bg-ivory-dim/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm! text-ink">
                      Order #{order.orderNumber}
                    </span>
                    <Badge
                      variant={isPaid ? "success" : "turmeric"}
                      className="text-[10px]!"
                    >
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  <p className="text-xs! text-ink-soft">
                    Issued on {formatDateTime(order.orderDate)} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-ink/5">
                  <div className="text-left sm:text-right">
                    <span className="font-mono font-semibold text-sm! text-ink block">
                      {formatINR(order.grandTotal)}
                    </span>
                    <span className="text-[11px]! text-emerald-700 font-medium">
                      All-Inclusive
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="text-xs! gap-1.5 text-oxblood hover:bg-oxblood/5 border-oxblood/30"
                  >
                    <Link to={`/account/orders/${order.orderId}`}>
                      <span>View Receipt</span>
                      <ArrowRight size={13} />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
