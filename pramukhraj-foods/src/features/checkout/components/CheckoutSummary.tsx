import * as Tooltip from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";
import { Link } from "react-router-dom";
import { formatINR } from "@/lib/utils";
import { useCheckoutImages } from "../hooks/useCheckoutImages";
import type { CheckoutSession } from "../types/checkout.types";
import { CouponForm } from "./CouponForm";

export function CheckoutSummary({
  session,
  busy,
  onApplyCoupon,
  onRemoveCoupon,
}: {
  session: CheckoutSession;
  busy: boolean;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => Promise<void>;
}) {
  const images = useCheckoutImages(session.items);
  const p = session.pricing;
  const taxRatePercent = finiteOrZero(p.taxRatePercent);
  const taxAmount = finiteOrZero(p.taxAmount);
  return (
    <aside className="h-fit rounded-[1.75rem] border border-ink/10 bg-ivory-dim p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl!">Order summary</h2>
        <Link to="/cart" className="text-xs! font-semibold text-oxblood">
          Edit cart
        </Link>
      </div>
      <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
        {session.items.map(item => (
          <div key={item.productVariantId} className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-xl bg-tan">
              <img
                src={images[item.productId] || "/favicon.ico"}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm! font-medium">
                {item.productName}
              </p>
              <p className="text-xs! text-ink-soft">
                {item.variantName} · Qty {item.quantity}
              </p>
            </div>
            <span className="font-mono text-sm!">
              {formatINR(item.lineSubtotal)}
            </span>
          </div>
        ))}
      </div>
      <div className="my-5">
        <CouponForm
          currentCode={session.couponCode}
          busy={busy}
          onApply={onApplyCoupon}
          onRemove={onRemoveCoupon}
        />
      </div>
      <div className="space-y-2 border-t border-ink/10 pt-4 text-sm!">
        <Row label="MRP" value={p.mrpTotal} info="The combined maximum retail price of all selected items before product or coupon discounts." />
        <Row label="Product savings" value={-p.itemDiscountAmount} accent info="Savings already included in current product selling prices compared with MRP." />
        <Row label="Coupon" value={-p.couponDiscountAmount} accent info="The discount applied by your active coupon. It is deducted once from the eligible item value." />
        <Row label="Prepaid shipping" value={p.customerShippingAmount} info="The live prepaid delivery charge for the selected PIN code and best-rated serviceable courier." />
        <Row label={`Tax (${taxRatePercent}%, excluded)`} value={taxAmount} subdued info={`Tax is calculated at ${taxRatePercent}% on the discounted merchandise value and added once to your payable total.`} />
      </div>
      <div className="mt-4 flex justify-between border-t border-ink/10 pt-4 text-base! font-semibold">
        <span className="flex items-center gap-1">Total <SummaryInfo label="Total payable" description="The final amount payable after product savings and coupon discount, plus excluded tax and any prepaid shipping charge." value={p.grandTotal} /></span>
        <span className="font-mono text-lg! text-oxblood">
          {formatINR(p.grandTotal)}
        </span>
      </div>
      <p className="mt-2 text-[11px]! leading-5 text-ink-soft">
         Tax is excluded
        from product prices and added once at checkout.
      </p>
    </aside>
  );
}

function SummaryInfo({ label, description, value }: { label: string; description: string; value: number }) {
  return <Tooltip.Provider delayDuration={200}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild><button type="button" aria-label={`About ${label}`} className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full text-ink-soft hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxblood/40"><Info size={12} aria-hidden /></button></Tooltip.Trigger>
      <Tooltip.Portal><Tooltip.Content side="top" sideOffset={6} collisionPadding={12} className="z-[100] max-w-72 rounded-lg border border-ink/10 bg-ink px-3 py-2.5 text-xs! leading-5 text-ivory shadow-xl"><span className="font-semibold">{label}:</span> {description}<span className="mt-1.5 block border-t border-ivory/20 pt-1.5 text-ivory/90">Current value: {value < 0 ? "−" : ""}{formatINR(Math.abs(value))}</span><Tooltip.Arrow className="fill-ink" /></Tooltip.Content></Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>;
}

function finiteOrZero(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function Row({
  label,
  value,
  accent,
  subdued,
  info,
}: {
  label: string;
  value: number;
  accent?: boolean;
  subdued?: boolean;
  info: string;
}) {
  return (
    <div
      className={`flex justify-between ${accent ? "text-green-700" : subdued ? "text-ink-soft" : "text-ink-soft"}`}
    >
      <span className="flex items-center gap-1">{label}<SummaryInfo label={label} description={info} value={value} /></span>
      <span className="font-mono text-ink">
        {value === 0 && label.includes("shipping")
          ? "Free"
          : `${value < 0 ? "−" : ""}${formatINR(Math.abs(value))}`}
      </span>
    </div>
  );
}
