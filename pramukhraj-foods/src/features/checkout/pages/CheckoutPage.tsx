import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { AddressManager } from "@/features/customer-addresses/components/AddressManager";
import type { CustomerAddress } from "@/features/customer-addresses/types/address.types";
import { useCheckout } from "../hooks/useCheckout";
import { CheckoutSkeleton } from "../components/CheckoutSkeleton";
import { CheckoutSummary } from "../components/CheckoutSummary";
import { ShippingQuoteCard } from "../components/ShippingQuoteCard";

export function CheckoutPage() {
  const checkout = useCheckout();
  const [billingSame, setBillingSame] = useState(true);
  const [readyMessage, setReadyMessage] = useState("");

  if (checkout.isLoading && !checkout.session) return <CheckoutSkeleton />;
  if (!checkout.session)
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <AlertTriangle className="mx-auto text-oxblood" />
        <h1 className="mt-4 font-display text-2xl!">Checkout is unavailable</h1>
        <p className="mt-2 text-sm! text-ink-soft">
          {checkout.error || "Your selected cart items could not be prepared."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/cart">Return to cart</Link>
          </Button>
          <Button onClick={() => void checkout.initialize()}>Try again</Button>
        </div>
      </main>
    );

  const session = checkout.session;
  const quoteExpired = hasExpired(session.shippingQuote?.quoteExpiresOn);
  const warnings = quoteExpired && !session.warnings.some(warning => warning.toLowerCase().includes("shipping quote expired"))
    ? [...session.warnings, "The shipping quote expired. Refresh the shipping rate."]
    : session.warnings;
  const chooseAddress = async (address: CustomerAddress) => {
    setReadyMessage("");
    try {
      await checkout.chooseAddress(
        address.id,
        billingSame ? address.id : session.billingAddressId
      );
    } catch {
      /* Store exposes the safe error message. */
    }
  };
  const chooseBillingAddress = async (address: CustomerAddress) => {
    if (!session.shippingAddressId) return;
    setReadyMessage("");
    try {
      await checkout.chooseAddress(session.shippingAddressId, address.id);
    } catch {
      /* Store exposes the safe error message. */
    }
  };
  const addressChanged = (address: CustomerAddress) => {
    if (
      address.id !== session.shippingAddressId &&
      address.id !== session.billingAddressId
    )
      return;
    setReadyMessage("");
    const billingId =
      billingSame && address.id === session.shippingAddressId
        ? address.id
        : session.billingAddressId;
    void checkout
      .chooseAddress(session.shippingAddressId, billingId)
      .catch(() => undefined);
  };
  const addressRemoved = (address: CustomerAddress) => {
    if (
      address.id !== session.shippingAddressId &&
      address.id !== session.billingAddressId
    )
      return;
    setReadyMessage("");
    const shippingId =
      address.id === session.shippingAddressId
        ? null
        : session.shippingAddressId;
    const billingId =
      address.id === session.billingAddressId ? null : session.billingAddressId;
    void checkout.chooseAddress(shippingId, billingId).catch(() => undefined);
  };
  const setBillingMode = async (same: boolean) => {
    setBillingSame(same);
    if (
      same &&
      session.shippingAddressId &&
      session.billingAddressId !== session.shippingAddressId
    ) {
      try {
        await checkout.chooseAddress(
          session.shippingAddressId,
          session.shippingAddressId
        );
      } catch {
        /* Store exposes the safe error message. */
      }
    }
  };
  const continuePayment = async () => {
    setReadyMessage("");
    try {
      const refreshed = await checkout.refresh();
      if (refreshed?.isReadyForPayment)
        setReadyMessage(
          "Checkout is verified and ready. Payment will be enabled in the next implementation phase."
        );
    } catch {
      /* Store exposes the safe error message. */
    }
  };
  const refreshShippingRate = async () => {
    setReadyMessage("");
    try {
      await checkout.refresh();
    } catch {
      /* Store exposes the safe error message and keeps the retry available. */
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12 md:px-6">
      <div>
        <p className="text-xs! font-semibold uppercase tracking-[0.2em] text-oxblood">
          Secure prepaid checkout
        </p>
        <h1 className="mt-2 font-display text-3xl! text-ink sm:text-4xl!">
          Review and confirm
        </h1>
        <p className="mt-2 text-sm! text-ink-soft">
          Your prices, stock, coupon, and shipping rate are checked again on the
          server.
        </p>
      </div>
      {checkout.error && (
        <div
          role="alert"
          className="mt-6 flex gap-3 rounded-2xl border border-oxblood/20 bg-oxblood/5 p-4 text-sm! text-oxblood"
        >
          <AlertTriangle size={18} className="shrink-0" />
          {checkout.error}
        </div>
      )}
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-ink/10 bg-white/45 p-5 sm:p-7">
            <AddressManager
              selectable
              selectedId={session.shippingAddressId}
              onSelect={address => void chooseAddress(address)}
              onAddressChanged={addressChanged}
              onAddressRemoved={addressRemoved}
            />
            <label className="mt-5 flex items-center gap-2 rounded-xl bg-tan/30 p-3 text-sm! text-ink">
              <input
                type="checkbox"
                checked={billingSame}
                onChange={event => void setBillingMode(event.target.checked)}
                className="accent-oxblood"
              />
              Use delivery address for billing
            </label>
            {!billingSame && (
              <div className="mt-6 border-t border-ink/10 pt-6">
                <p className="mb-4 text-sm! font-semibold text-ink">
                  Choose a billing address
                </p>
                <AddressManager
                  selectable
                  selectedId={session.billingAddressId}
                  onSelect={address => void chooseBillingAddress(address)}
                  onAddressChanged={addressChanged}
                  onAddressRemoved={addressRemoved}
                />
              </div>
            )}
          </section>
          <section className="rounded-[1.75rem] border border-ink/10 bg-white/45 p-5 sm:p-7">
            <h2 className="font-display text-xl!">Prepaid delivery</h2>
            <p className="mt-1 text-xs! text-ink-soft mb-2.5">
              We partner with top-rated couriers to ensure fast, reliable
              delivery.
            </p>
           
            <ShippingQuoteCard quote={session.shippingQuote} />
          </section>
          {warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-50 p-4">
              <p className="text-sm! font-semibold text-amber-900">
                Checkout needs attention
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs! text-amber-800">
                {warnings.map(warning => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              {quoteExpired && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3 border-amber-700/30 text-amber-900 hover:bg-amber-100"
                  disabled={checkout.isMutating}
                  onClick={() => void refreshShippingRate()}
                >
                  {checkout.isMutating ? <><LoaderCircle size={14} className="animate-spin" /> Refreshing…</> : "Refresh shipping rate"}
                </Button>
              )}
            </div>
          )}
          <div className=" rounded-[1.75rem] border border-ink/10 bg-teal-deep p-5 text-ivory sm:p-7">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 shrink-0" />
              <div>
                <h2 className="font-display text-xl!">Continue securely</h2>
                <p className="mt-1 text-sm! leading-6 text-ivory/70">
                  This phase stops before order creation or payment. Continuing
                  performs a final stock, price, coupon, and shipping refresh.
                </p>
              </div>
            </div>
            <Button
              className="mt-5 w-full sm:w-auto"
              variant="secondary"
              disabled={checkout.isMutating || quoteExpired || !session.isReadyForPayment}
              onClick={() => void continuePayment()}
            >
              {checkout.isMutating ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Refreshing…
                </>
              ) : (
                "Continue to payment"
              )}
            </Button>
            {readyMessage && (
              <p className="mt-4 flex gap-2 text-sm! text-green-200">
                <CheckCircle2 size={17} className="shrink-0" />
                {readyMessage}
              </p>
            )}
          </div>
        </div>
        <CheckoutSummary
          session={session}
          busy={checkout.isMutating}
          onApplyCoupon={checkout.applyCoupon}
          onRemoveCoupon={async () => {
            try {
              await checkout.removeCoupon();
            } catch {
              /* Store exposes the safe error message. */
            }
          }}
        />
      </div>
    </main>
  );
}

function hasExpired(value: string | null | undefined) {
  if (!value) return false;
  const expiresAt = Date.parse(value);
  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}
