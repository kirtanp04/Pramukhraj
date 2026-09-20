import { Clock3, Star, Truck } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { CheckoutShippingQuote } from "../types/checkout.types";

export function ShippingQuoteCard({ quote }: { quote: CheckoutShippingQuote | null }) {
  if (!quote) return <div className="rounded-2xl border border-dashed border-ink/20 p-5 text-sm! text-ink-soft">Choose a delivery address to calculate the best prepaid courier.</div>;

  return <div className="rounded-2xl border border-teal/20 bg-teal/5 p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm! font-semibold text-teal-deep"><Truck size={17} className="shrink-0" /><span className="truncate">{quote.deliveryMethod || "Standard Delivery"}</span></p>
        <p className="mt-1 text-xs! text-ink-soft">via {quote.courierName} or fastest available partner</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs! text-ink-soft">
          <span className="flex items-center gap-1"><Clock3 size={14} />{deliveryEstimate(quote)}</span>
          {quote.rating !== null && <span className="flex items-center gap-1"><Star size={13} className="fill-turmeric text-turmeric" />{quote.rating.toFixed(1)} courier rating</span>}
        </div>
        <span className="mt-2 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[11px]! font-semibold text-green-800">Best-rated available partner</span>
      </div>
      <span className="shrink-0 font-mono text-sm! font-semibold text-ink">{quote.customerRate === 0 ? "Free" : formatINR(quote.customerRate)}</span>
    </div>
  </div>;
}

function deliveryEstimate(quote: CheckoutShippingQuote) {
  const minimum = quote.estimatedDeliveryDays
  const maximum = quote.estimatedDeliveryMaxDays
  if (!minimum) return "Delivery estimate pending"
  return maximum && maximum > minimum
    ? `${minimum}–${maximum} estimated days`
    : `${minimum} estimated ${minimum === 1 ? "day" : "days"}`
}
