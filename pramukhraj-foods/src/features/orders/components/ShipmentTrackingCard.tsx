import { useState } from "react";
import { Check, Copy, ExternalLink, MapPin, Truck, History } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { CustomerOrderShipmentDetail } from "../types/order.types";

interface ShipmentTrackingCardProps {
  shipment: CustomerOrderShipmentDetail;
}

export function ShipmentTrackingCard({ shipment }: ShipmentTrackingCardProps) {
  const [copied, setCopied] = useState(false);

  const copyAwb = () => {
    if (!shipment.awbCode) return;
    navigator.clipboard.writeText(shipment.awbCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const activities = shipment.activities ?? [];

  return (
    <div className="rounded-2xl border border-ink/10 bg-ivory p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-oxblood/10 text-oxblood">
            <Truck size={20} />
          </div>
          <div>
            <h4 className="font-medium text-ink text-sm! sm:text-base!">
              {shipment.courierName ? `Shipped via ${shipment.courierName}` : "Shipment Partner Assigned"}
            </h4>
            <div className="flex items-center gap-2 text-xs! text-ink-soft">
              {shipment.awbCode ? (
                <>
                  <span>AWB: <span className="font-mono font-medium text-ink">{shipment.awbCode}</span></span>
                  <button
                    onClick={copyAwb}
                    className="inline-flex items-center gap-1 text-oxblood hover:text-oxblood-deep cursor-pointer transition-colors"
                    title="Copy AWB Code"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span className="text-[11px]!">{copied ? "Copied" : "Copy"}</span>
                  </button>
                </>
              ) : (
                <span>AWB Generation in progress</span>
              )}
            </div>
          </div>
        </div>

        {shipment.trackingUrl && (
          <a
            href={shipment.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-ivory-dim px-4 py-2 text-xs! font-medium text-ink hover:border-oxblood/40 hover:text-oxblood transition-colors"
          >
            <span>Live Courier Tracking</span>
            <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Date Milestones Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl bg-ivory-dim p-3.5 text-xs!">
        {shipment.pickupScheduledOn && (
          <div>
            <span className="text-ink-soft block text-[11px]!">Pickup Scheduled:</span>
            <span className="font-medium text-ink">{formatDateTime(shipment.pickupScheduledOn)}</span>
          </div>
        )}
        {shipment.shippedOn && (
          <div>
            <span className="text-ink-soft block text-[11px]!">Dispatched On:</span>
            <span className="font-medium text-ink">{formatDateTime(shipment.shippedOn)}</span>
          </div>
        )}
        {shipment.deliveredOn && (
          <div>
            <span className="text-ink-soft block text-[11px]!">Delivered On:</span>
            <span className="font-medium text-ink text-emerald-700">{formatDateTime(shipment.deliveredOn)}</span>
          </div>
        )}
        {shipment.estimatedDeliveryOn && !shipment.deliveredOn && (
          <div>
            <span className="text-ink-soft block text-[11px]!">Expected Delivery:</span>
            <span className="font-medium text-ink">{new Date(shipment.estimatedDeliveryOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        )}
      </div>

      {/* Tracking Activities History */}
      {activities.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-xs! font-medium text-ink-soft uppercase tracking-wider">
            <History size={14} />
            <span>Tracking History ({activities.length})</span>
          </div>
          <div className="relative pl-5 space-y-4 border-l border-ink/10 ml-2">
            {activities.map((activity, idx) => (
              <div key={activity.id ?? idx} className="relative">
                <div className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-oxblood ring-4 ring-ivory" />
                <div>
                  <p className="text-xs! font-medium text-ink">{activity.activity}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]! text-ink-soft mt-0.5">
                    <span>{formatDateTime(activity.date)}</span>
                    {activity.location && (
                      <span className="flex items-center gap-0.5">
                        <MapPin size={11} /> {activity.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
