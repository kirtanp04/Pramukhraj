import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Truck,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  LoaderCircle,
  History,
  ArrowRight,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ordersApi } from "@/features/orders/api/orders.api";
import { OrderStatusTimeline } from "@/features/orders/components/OrderStatusTimeline";
import type { PublicOrderTracking } from "@/features/orders/types/order.types";

export function TrackOrder() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PublicOrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const data = await ordersApi.trackPublic(trimmed);
      if (data) {
        setResult(data);
      } else {
        setResult(null);
        setError(`No shipment or order found matching "${trimmed}". Please double-check your Order Number or AWB.`);
      }
    } catch {
      setResult(null);
      setError(`No shipment or order found matching "${trimmed}". Please double-check your Order Number or AWB.`);
    } finally {
      setIsLoading(false);
    }
  }

  const copyAwb = (awbCode: string) => {
    navigator.clipboard.writeText(awbCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 space-y-8">
      {/* Title Section */}
      <div className="text-center space-y-2">
        <h1 className="font-display font-medium text-ink text-3xl! sm:text-4xl!">Track Your Shipment</h1>
        <p className="text-xs! sm:text-sm! text-ink-soft max-w-md mx-auto">
          Enter your Order Number (e.g. <span className="font-mono text-ink">ORD-...</span>) or Shiprocket AWB tracking code to see real-time updates.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="mx-auto flex max-w-lg gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. ORD-202609201140-A1B2C3 or 1432456789"
            className="w-full rounded-full border border-ink/20 bg-ivory px-5 py-3 text-sm! outline-none focus:border-oxblood transition-colors shadow-2xs font-mono"
          />
        </div>
        <Button type="submit" disabled={isLoading || !query.trim()} className="rounded-full px-6 gap-2">
          {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
          <span>Track</span>
        </Button>
      </form>

      {/* Error / Not Found Message */}
      {error && (
        <div className="mx-auto max-w-lg rounded-xl border border-oxblood/20 bg-oxblood/5 p-4 text-oxblood flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs! sm:text-sm!">
            <p className="font-medium">{error}</p>
            <p className="text-xs! text-ink-soft">
              Already have an account? Log in to your <Link to="/account/orders" className="text-oxblood underline">Order History</Link> to view all your purchases.
            </p>
          </div>
        </div>
      )}

      {/* Tracking Result Card */}
      {result && (
        <div className="space-y-6">
          {/* Order Header Summary */}
          <div className="rounded-2xl border border-ink/10 bg-ivory p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-ink text-base! sm:text-lg!">
                  Order #{result.orderNumber}
                </span>
                <Badge
                  variant={
                    result.orderStatus.toLowerCase() === "confirmed"
                      ? "teal"
                      : result.orderStatus.toLowerCase() === "cancelled"
                      ? "oxblood"
                      : "soft"
                  }
                >
                  {result.orderStatus}
                </Badge>
                {result.shipmentStatus && (
                  <Badge variant="turmeric">{result.shipmentStatus}</Badge>
                )}
              </div>
              <p className="text-xs! text-ink-soft mt-1">
                Carrier: <span className="font-medium text-ink">{result.courierName ?? "Shiprocket Partner Network"}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {result.awbCode && (
                <div className="flex items-center gap-1.5 rounded-full bg-ivory-dim border border-ink/10 px-3.5 py-1.5 text-xs!">
                  <span className="text-ink-soft">AWB:</span>
                  <span className="font-mono font-medium text-ink">{result.awbCode}</span>
                  <button
                    type="button"
                    onClick={() => copyAwb(result.awbCode!)}
                    className="ml-1 text-oxblood hover:text-oxblood-deep cursor-pointer"
                    title="Copy AWB"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              )}

              {result.trackingUrl && (
                <a
                  href={result.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-ivory-dim px-4 py-2 text-xs! font-medium text-ink hover:border-oxblood/40 hover:text-oxblood transition-colors"
                >
                  <span>Courier Tracking</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>

          {/* Fulfillment Milestone Stepper */}
          <OrderStatusTimeline
            orderStatus={result.orderStatus}
            paymentStatus={result.orderStatus === "Confirmed" ? "Paid" : "Pending"}
            shipmentStatus={result.shipmentStatus}
            estimatedDeliveryOn={result.estimatedDeliveryOn}
          />

          {/* Milestone Details & Activity Stream */}
          <div className="rounded-2xl border border-ink/10 bg-ivory p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-oxblood" />
                <h3 className="font-display font-medium text-ink text-base!">Shipment Milestones</h3>
              </div>
              {result.estimatedDeliveryOn && (
                <span className="text-xs! text-turmeric-deep bg-turmeric/15 px-3 py-1 rounded-full font-medium">
                  Est. Delivery: {new Date(result.estimatedDeliveryOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>

            {/* Date badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl bg-ivory-dim p-3.5 text-xs!">
              {result.shippedOn && (
                <div>
                  <span className="text-ink-soft block text-[11px]!">Dispatched On:</span>
                  <span className="font-medium text-ink">{formatDateTime(result.shippedOn)}</span>
                </div>
              )}
              {result.deliveredOn && (
                <div>
                  <span className="text-ink-soft block text-[11px]!">Delivered On:</span>
                  <span className="font-medium text-emerald-700">{formatDateTime(result.deliveredOn)}</span>
                </div>
              )}
              {result.estimatedDeliveryOn && !result.deliveredOn && (
                <div>
                  <span className="text-ink-soft block text-[11px]!">Expected Delivery:</span>
                  <span className="font-medium text-ink">{new Date(result.estimatedDeliveryOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              )}
            </div>

            {/* Activities List */}
            {result.activities.length > 0 ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs! font-medium text-ink-soft uppercase tracking-wider">
                  <History size={14} />
                  <span>Logistics Scan History ({result.activities.length})</span>
                </div>
                <div className="relative pl-5 space-y-4 border-l border-ink/10 ml-2">
                  {result.activities.map((activity, idx) => (
                    <div key={idx} className="relative">
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
            ) : (
              <div className="text-center py-6 text-xs! text-ink-soft">
                Courier partner has received order information. Detailed transit checkpoints will appear once the package is scanned at the hub.
              </div>
            )}

            <div className="border-t border-ink/10 pt-4 flex items-center justify-between">
              <span className="text-xs! text-ink-soft">Need detailed item invoice or delivery address changes?</span>
              <Button variant="ghost" size="sm" asChild className="text-xs! gap-1">
                <Link to="/account/orders">
                  <span>Sign in to account</span>
                  <ArrowRight size={13} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Helpful FAQ card when no search performed */}
      {!hasSearched && (
        <div className="rounded-2xl border border-ink/10 bg-ivory-dim p-6 text-center space-y-3 max-w-xl mx-auto">
          <Truck size={32} className="mx-auto text-oxblood" />
          <h3 className="font-display font-medium text-ink text-base!">Fast & Reliable Nationwide Delivery</h3>
          <p className="text-xs! text-ink-soft">
            Orders are packed from our Anand hub within 24 hours. Once shipped, you will receive SMS and tracking updates on every milestone.
          </p>
        </div>
      )}
    </div>
  );
}
