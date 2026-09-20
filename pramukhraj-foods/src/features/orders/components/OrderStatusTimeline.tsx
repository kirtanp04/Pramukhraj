import { CheckCircle2, Clock, Package, Truck, AlertTriangle, XCircle, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStatusTimelineProps {
  orderStatus: string;
  paymentStatus: string;
  shipmentStatus?: string | null;
  estimatedDeliveryOn?: string | null;
}

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const steps: Step[] = [
  { id: "placed", label: "Order Placed", description: "Order details received", icon: Clock },
  { id: "confirmed", label: "Payment Confirmed", description: "Payment verified successfully", icon: CheckCircle2 },
  { id: "shipped", label: "Dispatched", description: "Handed to courier partner", icon: Truck },
  { id: "out_for_delivery", label: "Out for Delivery", description: "Courier is on the way", icon: Package },
  { id: "delivered", label: "Delivered", description: "Delivered to your address", icon: Home },
];

export function OrderStatusTimeline({
  orderStatus,
  paymentStatus,
  shipmentStatus,
  estimatedDeliveryOn,
}: OrderStatusTimelineProps) {
  const isCancelled = orderStatus.toLowerCase() === "cancelled" || shipmentStatus?.toLowerCase() === "cancelled";
  const isFailed = shipmentStatus?.toLowerCase() === "deliveryfailed" || shipmentStatus?.toLowerCase() === "rtoinitiated" || shipmentStatus?.toLowerCase() === "rtodelivered";

  const getActiveStepIndex = () => {
    if (isCancelled) return -1;
    const sStatus = shipmentStatus?.toLowerCase() ?? "";

    if (sStatus === "delivered") return 4;
    if (sStatus === "outfordelivery") return 3;
    if (["intransit", "pickedup", "pickupscheduled", "awbassigned", "created"].includes(sStatus)) return 2;
    if (orderStatus.toLowerCase() === "confirmed" && paymentStatus.toLowerCase() === "paid") return 1;
    return 0;
  };

  const activeIndex = getActiveStepIndex();

  return (
    <div className="rounded-2xl border border-ink/10 bg-ivory p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
        <div>
          <h3 className="font-display font-medium text-ink text-base! sm:text-lg!">Fulfillment Status</h3>
          <p className="text-xs! text-ink-soft">
            Live order tracking and milestone updates
          </p>
        </div>
        {estimatedDeliveryOn && !isCancelled && activeIndex < 4 && (
          <div className="rounded-full bg-turmeric/15 px-3 py-1 text-xs! font-medium text-turmeric-deep">
            Est. Delivery: {new Date(estimatedDeliveryOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        )}
      </div>

      {isCancelled ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-oxblood/20 bg-oxblood/5 p-4 text-oxblood">
          <XCircle size={24} className="shrink-0" />
          <div>
            <p className="font-semibold text-sm!">Order Cancelled</p>
            <p className="text-xs! text-ink-soft">This order was cancelled. If you were charged, your refund will be processed within 5-7 business days.</p>
          </div>
        </div>
      ) : isFailed ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle size={24} className="shrink-0" />
          <div>
            <p className="font-semibold text-sm!">Delivery Issue Encountered ({shipmentStatus})</p>
            <p className="text-xs! text-amber-800">Our courier team attempted delivery or initiated a return. Please inspect tracking details below or contact customer support.</p>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          {/* Desktop & Tablet Stepper */}
          <div className="hidden sm:flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index <= activeIndex;
              const isCurrent = index === activeIndex;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                        isCompleted
                          ? "bg-oxblood text-ivory shadow-xs"
                          : "bg-ink/5 text-ink-soft border border-ink/10"
                      )}
                    >
                      <Icon size={16} />
                    </div>
                    <span
                      className={cn(
                        "font-medium text-xs!",
                        isCompleted ? "text-ink font-semibold" : "text-ink-soft"
                      )}
                    >
                      {step.label}
                    </span>
                    <span className="text-[11px]! text-ink-soft max-w-[90px] leading-tight">
                      {isCurrent ? "In Progress" : isCompleted ? "Done" : "Pending"}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "mx-3 h-0.5 flex-1 transition-colors",
                        index < activeIndex ? "bg-oxblood" : "bg-ink/10"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Stepper (Vertical) */}
          <div className="sm:hidden space-y-4">
            {steps.map((step, index) => {
              const isCompleted = index <= activeIndex;
              const isCurrent = index === activeIndex;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                        isCompleted
                          ? "bg-oxblood text-ivory"
                          : "bg-ink/5 text-ink-soft border border-ink/10"
                      )}
                    >
                      <Icon size={14} />
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "my-1 w-0.5 h-6",
                          index < activeIndex ? "bg-oxblood" : "bg-ink/10"
                        )}
                      />
                    )}
                  </div>
                  <div className="pt-0.5">
                    <p
                      className={cn(
                        "text-xs! font-medium",
                        isCompleted ? "text-ink font-semibold" : "text-ink-soft"
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px]! text-ink-soft">
                      {step.description} {isCurrent && "• (Current Step)"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
