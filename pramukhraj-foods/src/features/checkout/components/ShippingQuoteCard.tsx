import { AlertTriangle, CheckCircle2, Clock3, LoaderCircle, Star, Truck } from "lucide-react";
import { formatINR } from "@/lib/utils";
import type { CheckoutShippingQuote, DeliveryVerification } from "../types/checkout.types";

interface ShippingQuoteCardProps {
  quote: CheckoutShippingQuote | null;
  deliveryVerification?: DeliveryVerification | null;
  hasAddress?: boolean;
  isVerifying?: boolean;
}

export function ShippingQuoteCard({
  quote,
  deliveryVerification,
  hasAddress = false,
  isVerifying = false,
}: ShippingQuoteCardProps) {
  if (isVerifying) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-ink/15 bg-white/40 p-5 text-sm! text-ink-soft">
        <LoaderCircle size={18} className="animate-spin text-oxblood" />
        <span>Verifying delivery to your address…</span>
      </div>
    );
  }

  if (!hasAddress) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/20 p-5 text-sm! text-ink-soft">
        Choose a delivery address to verify delivery and calculate the best prepaid courier.
      </div>
    );
  }

  if (deliveryVerification && !deliveryVerification.isDeliverable) {
    return (
      <div className="rounded-2xl border border-oxblood/30 bg-oxblood/5 p-5 text-oxblood">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-oxblood" />
          <div className="min-w-0">
            <p className="text-sm! font-semibold text-oxblood">Delivery unavailable to this address</p>
            <p className="mt-1 text-xs! leading-relaxed text-ink-soft">
              {deliveryVerification.message || "Couriers cannot deliver to this address / PIN code."}
            </p>
            <p className="mt-2 text-[11px]! font-medium text-oxblood">
              Please choose another saved address or add a serviceable address above to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/20 p-5 text-sm! text-ink-soft">
        Delivery address selected. Refresh shipping rates to continue.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-teal/20 bg-teal/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm! font-semibold text-teal-deep">
            <Truck size={17} className="shrink-0" />
            <span className="truncate">{quote.deliveryMethod || "Standard Delivery"}</span>
          </p>
          <p className="mt-1 text-xs! text-ink-soft">via {quote.courierName} or fastest available partner</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs! text-ink-soft">
            <span className="flex items-center gap-1">
              <Clock3 size={14} />
              {deliveryEstimate(quote)}
            </span>
            {quote.rating !== null && (
              <span className="flex items-center gap-1">
                <Star size={13} className="fill-turmeric text-turmeric" />
                {quote.rating.toFixed(1)} courier rating
              </span>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px]! font-semibold text-green-800">
              <CheckCircle2 size={12} />
              Delivery verified{deliveryVerification?.postalCode ? ` · PIN ${deliveryVerification.postalCode}` : ""}
            </span>
            <span className="inline-flex rounded-full bg-tan/70 px-2 py-0.5 text-[11px]! font-medium text-ink">
              Best-rated available partner
            </span>
          </div>
        </div>
        <span className="shrink-0 font-mono text-sm! font-semibold text-ink">
          {quote.customerRate === 0 ? "Free" : formatINR(quote.customerRate)}
        </span>
      </div>
    </div>
  );
}

function deliveryEstimate(quote: CheckoutShippingQuote) {
  const minimum = quote.estimatedDeliveryDays;
  const maximum = quote.estimatedDeliveryMaxDays;
  if (!minimum) return "Delivery estimate pending";
  return maximum && maximum > minimum
    ? `${minimum}–${maximum} estimated days`
    : `${minimum} estimated ${minimum === 1 ? "day" : "days"}`;
}
