import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  FileText,
  FileCheck,
  RefreshCw,
  XCircle,
  CreditCard,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { paymentApi } from "@/features/checkout/api/payment.api";
import { useCustomerOrderDetail } from "../hooks/useCustomerOrderDetail";
import { OrderItemCard } from "../components/OrderItemCard";
import { OrderStatusTimeline } from "../components/OrderStatusTimeline";
import { ShipmentTrackingCard } from "../components/ShipmentTrackingCard";
import { OrderAddressCard } from "../components/OrderAddressCard";
import { OrderPaymentSummary } from "../components/OrderPaymentSummary";
import { BillOfSupplyReceiptModal } from "../components/BillOfSupplyReceiptModal";

export function CustomerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error, reload } = useCustomerOrderDetail(orderId);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string>("");
  const [receiptOpen, setReceiptOpen] = useState(false);

  const handleCancelOrder = async () => {
    if (!orderId) return;
    if (!window.confirm("Are you sure you want to cancel this pending order? Reserved stock will be released.")) {
      return;
    }
    setCancelling(true);
    setActionError("");
    try {
      await paymentApi.cancel(orderId);
      await reload();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-32 bg-ink/5 rounded-md" />
        <div className="h-36 bg-ink/5 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-72 bg-ink/5 rounded-2xl" />
          <div className="h-72 bg-ink/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link to="/account/orders">
            <ArrowLeft size={14} />
            <span>Back to Orders</span>
          </Link>
        </Button>
        <div className="rounded-2xl border border-oxblood/20 bg-oxblood/5 p-6 text-oxblood flex flex-col items-center justify-center text-center space-y-3">
          <AlertCircle size={32} />
          <h3 className="font-display font-medium text-base! sm:text-lg!">Unable to load order details</h3>
          <p className="text-xs! sm:text-sm! text-ink-soft max-w-md">{error || "Order not found or has been moved."}</p>
          <Button onClick={reload}>Retry</Button>
        </div>
      </div>
    );
  }

  const isPending = order.orderStatus.toLowerCase() === "pending" || order.paymentStatus.toLowerCase() === "pending";
  const isPaid = order.paymentStatus.toLowerCase() === "paid";
  const isCancelled = order.orderStatus.toLowerCase() === "cancelled";

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs! sm:text-sm!">
          <Link to="/account/orders">
            <ArrowLeft size={14} />
            <span>Back to Orders</span>
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {isPaid && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReceiptOpen(true)}
              className="text-xs! gap-1.5"
            >
              <FileCheck size={13} className="text-oxblood" />
              <span>Bill of Supply / Receipt</span>
            </Button>
          )}

          {order.canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="text-xs! text-oxblood hover:bg-oxblood/5 border-oxblood/30"
            >
              <XCircle size={13} />
              <span>{cancelling ? "Cancelling..." : "Cancel Order"}</span>
            </Button>
          )}

          {isPending && (
            <Button
              size="sm"
              onClick={() => navigate("/checkout")}
              className="text-xs! gap-1.5"
            >
              <CreditCard size={13} />
              <span>Complete Payment</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            className="text-xs! gap-1"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-4 text-xs! sm:text-sm! text-oxblood">
          {actionError}
        </div>
      )}

      {/* Order Header Summary */}
      <div className="rounded-2xl border border-ink/10 bg-ivory p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono font-bold text-ink text-lg! sm:text-xl!">
              Order #{order.orderNumber}
            </h1>
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
          <p className="flex items-center gap-1.5 text-xs! text-ink-soft">
            <Calendar size={13} />
            <span>Placed on {formatDateTime(order.orderDate)}</span>
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs! text-ink-soft block">Store Partner</span>
          <span className="font-medium text-ink text-sm! sm:text-base!">{order.storeName}</span>
        </div>
      </div>

      {/* Fulfillment Milestone Timeline */}
      <OrderStatusTimeline
        orderStatus={order.orderStatus}
        paymentStatus={order.paymentStatus}
        shipmentStatus={order.shipment?.status ?? order.shipmentStatus}
        estimatedDeliveryOn={order.shipment?.estimatedDeliveryOn}
      />

      {/* Live Shipment Details Card (if shipment created) */}
      {order.shipment && <ShipmentTrackingCard shipment={order.shipment} />}

      {/* Main Grid: Items + Summary / Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Ordered Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-ivory p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <h3 className="font-display font-medium text-ink text-base! sm:text-lg!">
                Ordered Items ({order.items.length})
              </h3>
            </div>

            <div className="space-y-3">
              {order.items.map((item) => (
                <OrderItemCard key={item.productVariantId} item={item} />
              ))}
            </div>

            {order.customerNote && (
              <div className="rounded-xl bg-ivory-dim p-3.5 mt-4 space-y-1 text-xs!">
                <div className="flex items-center gap-1.5 font-medium text-ink">
                  <FileText size={13} className="text-oxblood" />
                  <span>Customer Instructions / Note:</span>
                </div>
                <p className="text-ink-soft pl-5 italic">"{order.customerNote}"</p>
              </div>
            )}
          </div>

          {/* Addresses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <OrderAddressCard title="Shipping Address" address={order.shippingAddress} />
            <OrderAddressCard title="Billing Address" address={order.billingAddress} />
          </div>
        </div>

        {/* Right Column (1 span): Payment & Pricing Breakdown */}
        <div className="space-y-4">
          <OrderPaymentSummary order={order} />
        </div>
      </div>

      {/* Printable Bill of Supply / Order Receipt Modal */}
      <BillOfSupplyReceiptModal
        order={order}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </div>
  );
}
