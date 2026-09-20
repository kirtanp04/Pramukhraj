import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Truck,
  Calendar,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { formatINR, formatDateTime, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCustomerOrders } from "../hooks/useCustomerOrders";
import { OrderItemCard } from "../components/OrderItemCard";

const filterTabs = [
  { id: "all", label: "All Orders" },
  { id: "Pending", label: "Pending Payment" },
  { id: "Confirmed", label: "Confirmed" },
  { id: "Processing", label: "Processing" },
  { id: "Delivered", label: "Delivered" },
  { id: "Cancelled", label: "Cancelled" },
];

export function CustomerOrdersPage() {
  const navigate = useNavigate();
  const {
    orders,
    page,
    setPage,
    status,
    setStatus,
    totalPages,
    totalCount,
    isLoading,
    error,
    reload,
  } = useCustomerOrders("all", 1, 10);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <h2 className="font-display font-medium text-ink text-xl! sm:text-2xl!">Order History</h2>
          <p className="text-xs! sm:text-sm! text-ink-soft mt-1">
            Track your shipments, review past orders, and view fulfillment updates.
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = status === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatus(tab.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 font-medium transition-colors text-xs! sm:text-sm! cursor-pointer",
                isActive
                  ? "bg-oxblood text-ivory shadow-xs"
                  : "bg-ivory-dim text-ink hover:bg-ink/5 border border-ink/10"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-4 text-oxblood flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs! sm:text-sm!">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={reload}>Retry</Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-ink/10 bg-ivory p-6 space-y-4"
            >
              <div className="flex justify-between h-6 bg-ink/5 rounded-md w-1/3" />
              <div className="h-20 bg-ink/5 rounded-xl" />
              <div className="flex justify-between h-8 bg-ink/5 rounded-md w-1/4" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-ivory p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/5 text-ink-soft mb-3">
            <ShoppingBag size={28} />
          </div>
          <h3 className="font-display font-medium text-ink text-base! sm:text-lg!">No orders found</h3>
          <p className="text-xs! sm:text-sm! text-ink-soft max-w-sm mt-1 mb-5">
            {status !== "all"
              ? `You do not have any orders with status "${status}". Try selecting "All Orders".`
              : "You haven't placed any orders yet. Discover our premium organic grocery range!"}
          </p>
          <Button onClick={() => navigate("/products")}>Start Shopping</Button>
        </div>
      ) : (
        /* Order Cards List */
        <div className="space-y-5">
          {orders.map((order) => {
            const isPaid = order.paymentStatus.toLowerCase() === "paid";
            const isCancelled = order.orderStatus.toLowerCase() === "cancelled";
            const isPending = order.orderStatus.toLowerCase() === "pending" || order.paymentStatus.toLowerCase() === "pending";

            return (
              <div
                key={order.orderId}
                className="rounded-2xl border border-ink/10 bg-ivory p-5 sm:p-6 shadow-xs space-y-4 transition-all hover:border-oxblood/30"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-ink text-sm! sm:text-base!">
                        Order #{order.orderNumber}
                      </span>
                      <Badge
                        variant={
                          isCancelled
                            ? "oxblood"
                            : order.orderStatus.toLowerCase() === "confirmed"
                            ? "teal"
                            : isPending
                            ? "turmeric"
                            : "soft"
                        }
                      >
                        {order.orderStatus}
                      </Badge>
                      <Badge
                        variant={
                          isPaid
                            ? "success"
                            : isPending
                            ? "turmeric"
                            : "outline"
                        }
                      >
                        {order.paymentStatus}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1 text-[11px]! text-ink-soft mt-1">
                      <Calendar size={12} />
                      <span>Placed on {formatDateTime(order.orderDate)}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px]! text-ink-soft block">Grand Total</span>
                    <span className="font-mono font-bold text-oxblood text-base! sm:text-lg!">
                      {formatINR(order.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Shipment Quick Bar */}
                {order.shipmentStatus && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ivory-dim px-4 py-2.5 text-xs!">
                    <div className="flex items-center gap-2 text-ink">
                      <Truck size={14} className="text-oxblood" />
                      <span className="font-medium">
                        {order.courierName ? `${order.courierName}: ` : "Fulfillment: "}
                        <span className="text-oxblood font-semibold">{order.shipmentStatus}</span>
                      </span>
                      {order.awbCode && (
                        <span className="text-ink-soft font-mono">
                          • AWB: {order.awbCode}
                        </span>
                      )}
                    </div>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-oxblood hover:underline text-[11px]! font-medium"
                      >
                        <span>Live Tracking</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                )}

                {/* Items Preview */}
                <div className="space-y-2">
                  {order.items.slice(0, 3).map((item) => (
                    <OrderItemCard key={item.productVariantId} item={item} />
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs! text-ink-soft text-center py-1">
                      + {order.items.length - 3} more item(s) in this order
                    </p>
                  )}
                </div>

                {/* Order Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
                  <span className="text-xs! text-ink-soft">
                    Total: <span className="font-medium text-ink">{order.itemCount} item(s)</span>
                  </span>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/checkout`)}
                        className="text-xs!"
                      >
                        Complete Payment
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-xs! gap-1"
                    >
                      <Link to={`/account/orders/${order.orderId}`}>
                        <span>View Details & Tracking</span>
                        <ChevronRight size={13} />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-ink/10 pt-4 text-xs! sm:text-sm!">
              <span className="text-ink-soft">
                Page <span className="font-medium text-ink">{page}</span> of <span className="font-medium text-ink">{totalPages}</span> ({totalCount} orders)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
