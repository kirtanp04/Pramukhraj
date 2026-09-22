import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { StorageKey } from "@/constants/StorageKeys";
import { getApiErrorMessage } from "@/lib/apiClient";
import { formatINR } from "@/lib/utils";
import { loadCustomerProductImage } from "@/services/customerProductImageLoader";
import { useCartStore } from "@/store/cartStore";
import { AddressManager } from "@/features/customer-addresses/components/AddressManager";
import type { CustomerAddress } from "@/features/customer-addresses/types/address.types";
import { useCheckout } from "../hooks/useCheckout";
import { CheckoutSkeleton } from "../components/CheckoutSkeleton";
import { CheckoutSummary } from "../components/CheckoutSummary";
import { ShippingQuoteCard } from "../components/ShippingQuoteCard";
import { paymentApi } from "../api/payment.api";
import { openRazorpay } from "../services/razorpay.service";
import type { PendingOrderSummary } from "../types/payment.types";

const PAYMENT_REQUEST_KEY = "checkout-payment-request";
const PENDING_ORDER_KEY = "checkout-pending-order";

export function CheckoutPage() {
  const checkout = useCheckout();
  const navigate = useNavigate();
  const loadCart = useCartStore(state => state.loadCart);
  const [billingSame, setBillingSame] = useState(true);
  const [readyMessage, setReadyMessage] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const pendingOrder = readStoredPendingOrder();

  if (checkout.isLoading && !checkout.session) return <CheckoutSkeleton />;
  if (!checkout.session && pendingOrder)
    return <PendingPaymentRecovery order={pendingOrder} onCompleted={completePayment} />;
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
    if (isPaying) return;
    setIsPaying(true);
    try {
      let order = readPendingOrder(session.checkoutSessionId);
      if (order) {
        const status = await paymentApi.status(order.orderId);
        if (status?.isPaid) {
          completePayment(order.orderNumber, order.storeName, order.orderId);
          return;
        }
        if (!status?.canRetry) throw new Error("This payment window has ended. Please return to your cart.");
      } else {
        const refreshed = await checkout.refresh();
        if (!refreshed?.isReadyForPayment) throw new Error("Checkout needs attention before payment.");
        const placed = await paymentApi.placeOrder(refreshed.checkoutSessionId, getPaymentRequestKey(refreshed.checkoutSessionId));
        if (!placed) throw new Error("The order could not be created.");
        order = { orderId: placed.orderId, orderNumber: placed.orderNumber, storeName: placed.payment?.storeName ?? "" };
        sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({ checkoutSessionId: session.checkoutSessionId, ...order }));
      }
      const payment = await paymentApi.retry(order.orderId);
      if (!payment) throw new Error(order.paymentError || "Payment checkout is temporarily unavailable.");
      if (!order.storeName) order.storeName = payment.storeName;
      const verified = await paymentApi.verify(order.orderId, await openRazorpay(payment));
      if (!verified?.isPaid) throw new Error("Payment confirmation is still pending.");
      completePayment(order.orderNumber, payment.storeName, order.orderId);
    } catch (error) {
      try {
        const order = readPendingOrder(session.checkoutSessionId);
        if (order) {
          const status = await paymentApi.status(order.orderId);
          if (status?.isPaid) {
            completePayment(order.orderNumber, order.storeName, order.orderId);
            return;
          }
        }
      } catch {
        /* Ignore status check errors and fallback to showing error */
      }
      setReadyMessage(getApiErrorMessage(error));
    } finally {
      setIsPaying(false);
    }
  };
  function completePayment(orderNumber: string, storeName: string, orderId?: string) {
    sessionStorage.removeItem(PAYMENT_REQUEST_KEY);
    sessionStorage.removeItem(PENDING_ORDER_KEY);
    sessionStorage.removeItem(StorageKey.CheckoutSessionId);
    void loadCart();
    navigate("/order-confirmation", { replace: true, state: { orderNumber, storeName, orderId } });
  }
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
                  We verify stock, price, coupon, and shipping once more before
                  opening Razorpay's secure payment checkout.
                </p>
              </div>
            </div>
            <Button
              className="mt-5 w-full sm:w-auto"
              variant="secondary"
              disabled={checkout.isMutating || isPaying || quoteExpired || !session.isReadyForPayment}
              onClick={() => void continuePayment()}
            >
              {checkout.isMutating || isPaying ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  {isPaying ? "Starting secure payment…" : "Refreshing…"}
                </>
              ) : (
                "Continue to payment"
              )}
            </Button>
            {readyMessage && (
              <p role="alert" className="mt-4 flex gap-2 text-sm! text-amber-100">
                <AlertTriangle size={17} className="shrink-0" />
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

function PendingPaymentRecovery({
  order,
  onCompleted,
}: {
  order: PendingOrder;
  onCompleted: (orderNumber: string, storeName: string, orderId?: string) => void;
}) {
  const navigate = useNavigate();
  const loadCart = useCartStore(state => state.loadCart);
  const [summary, setSummary] = useState<PendingOrderSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const data = await paymentApi.summary(order.orderId);
        if (!active) return;
        if (data?.isPaid) {
          onCompleted(data.orderNumber, data.storeName, order.orderId);
          return;
        }
        setSummary(data);
        if (data?.items?.length) {
          void Promise.all(
            data.items.map(async item => [item.productId, await loadCustomerProductImage(item.productId)] as const)
          ).then(entries => {
            if (active) setImages(Object.fromEntries(entries));
          });
        }
      } catch (err) {
        if (active) setMessage(getApiErrorMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void fetchSummary();
    return () => {
      active = false;
    };
  }, [order.orderId]);

  useEffect(() => {
    if (!summary?.paymentExpiresOn) return;
    const updateCountdown = () => {
      const expires = Date.parse(summary.paymentExpiresOn);
      const diffSeconds = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setRemainingSeconds(diffSeconds);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [summary?.paymentExpiresOn]);

  const resumePayment = async () => {
    if (isPaying || isCancelling) return;
    setMessage("");
    setIsPaying(true);
    try {
      const status = await paymentApi.status(order.orderId);
      if (status?.isPaid) {
        onCompleted(order.orderNumber, order.storeName, order.orderId);
        return;
      }
      if (!status?.canRetry || remainingSeconds === 0)
        throw new Error("This payment window has ended. Please check your cart to start again.");
      const payment = await paymentApi.retry(order.orderId);
      if (!payment) throw new Error("Payment checkout is temporarily unavailable.");
      const verified = await paymentApi.verify(order.orderId, await openRazorpay(payment));
      if (!verified?.isPaid) throw new Error("Payment confirmation is still pending.");
      onCompleted(order.orderNumber, payment.storeName, order.orderId);
    } catch (error) {
      try {
        const status = await paymentApi.status(order.orderId);
        if (status?.isPaid) {
          onCompleted(order.orderNumber, order.storeName, order.orderId);
          return;
        }
      } catch {
        /* Ignore status check errors and fallback to showing error */
      }
      setMessage(getApiErrorMessage(error));
    } finally {
      setIsPaying(false);
    }
  };

  const cancelOrder = async () => {
    if (isPaying || isCancelling) return;
    setMessage("");
    setIsCancelling(true);
    try {
      await paymentApi.cancel(order.orderId);
      sessionStorage.removeItem(PAYMENT_REQUEST_KEY);
      sessionStorage.removeItem(PENDING_ORDER_KEY);
      sessionStorage.removeItem(StorageKey.CheckoutSessionId);
      await loadCart();
      navigate("/cart", { replace: true });
    } catch (error) {
      setMessage(getApiErrorMessage(error));
      setIsCancelling(false);
    }
  };

  const clearAndReturnToCart = async () => {
    sessionStorage.removeItem(PAYMENT_REQUEST_KEY);
    sessionStorage.removeItem(PENDING_ORDER_KEY);
    sessionStorage.removeItem(StorageKey.CheckoutSessionId);
    await loadCart();
    navigate("/cart", { replace: true });
  };

  if (isLoading) {
    return <CheckoutSkeleton />;
  }

  const isExpired = remainingSeconds === 0 || (!summary?.canRetry && !summary?.isPaid);

  if (isExpired || !summary) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <AlertTriangle className="mx-auto text-oxblood" size={36} />
        <h1 className="mt-4 font-display text-2xl! text-ink">Payment window ended</h1>
        <p className="mt-2 text-sm! text-ink-soft">
          The 20-minute reservation for order {order.orderNumber} has ended and reserved stock has been released.
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => void clearAndReturnToCart()}>
            Return to cart
          </Button>
        </div>
      </main>
    );
  }

  const minutes = Math.floor((remainingSeconds ?? 0) / 60);
  const seconds = (remainingSeconds ?? 0) % 60;
  const timerFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12 md:px-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-oxblood/10 px-3 py-1 text-xs! font-semibold uppercase tracking-wider text-oxblood">
            Order Reserved
          </span>
          <span className="font-mono text-xs! text-ink-soft">
            {summary.orderNumber}
          </span>
        </div>
        <h1 className="mt-2 font-display text-3xl! text-ink sm:text-4xl!">
          Complete payment
        </h1>
        <p className="mt-2 text-sm! text-ink-soft">
          Your order items and prices are reserved. Complete your payment before the timer ends.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-oxblood/20 bg-oxblood/5 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-oxblood text-ivory">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-sm! font-medium text-ink">Time remaining to pay</p>
            <p className="text-xs! text-ink-soft">After this, items will be released back to inventory</p>
          </div>
        </div>
        <span className="font-mono text-xl! font-bold text-oxblood sm:text-2xl!">
          {timerFormatted}
        </span>
      </div>

      {message && (
        <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-oxblood/20 bg-oxblood/10 p-4 text-sm! text-oxblood">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Details */}
        <div className="space-y-6 lg:col-span-7">
          {/* Delivery Address Card */}
          {summary.shippingAddress && (
            <div className="rounded-2xl border border-ink/10 bg-ivory-dim p-5">
              <div className="flex items-center gap-2 text-ink">
                <MapPin size={18} className="text-oxblood" />
                <h2 className="font-display text-lg! font-medium">Delivery address</h2>
              </div>
              <div className="mt-3 text-sm! leading-relaxed text-ink-soft">
                <p className="font-medium text-ink">{summary.shippingAddress.recipientName}</p>
                <p>{summary.shippingAddress.addressLine1}</p>
                {summary.shippingAddress.addressLine2 && <p>{summary.shippingAddress.addressLine2}</p>}
                <p>{summary.shippingAddress.city}, {summary.shippingAddress.state} - {summary.shippingAddress.postalCode}</p>
                <p className="mt-1 font-mono text-xs! text-ink">Phone: {summary.shippingAddress.mobileNumber}</p>
              </div>
            </div>
          )}

          {/* Courier & Delivery Estimate */}
          {summary.selectedCourierName && (
            <div className="rounded-2xl border border-ink/10 bg-ivory-dim p-5">
              <div className="flex items-center gap-2 text-ink">
                <Truck size={18} className="text-oxblood" />
                <h2 className="font-display text-lg! font-medium">Shipping & delivery</h2>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm!">
                <div>
                  <p className="font-medium text-ink">{summary.selectedCourierName}</p>
                  <p className="text-xs! text-ink-soft">Prepaid priority delivery</p>
                </div>
                {summary.estimatedDeliveryOn && (
                  <span className="rounded-lg bg-tan/40 px-2.5 py-1 text-xs! font-medium text-ink">
                    Est. delivery by {new Date(summary.estimatedDeliveryOn).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Reserved Items Card */}
          <div className="rounded-2xl border border-ink/10 bg-ivory-dim p-5">
            <h2 className="font-display text-lg! font-medium text-ink">
              Reserved items ({summary.items.length})
            </h2>
            <div className="mt-4 divide-y divide-ink/5">
              {summary.items.map(item => (
                <div key={item.productVariantId} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-tan">
                    <img
                      src={images[item.productId] || "/favicon.ico"}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm! font-medium text-ink">{item.productName}</p>
                    <p className="text-xs! text-ink-soft">
                      {item.variantName} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono text-sm! font-medium text-ink">
                    {formatINR(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              className="w-full py-6 text-base!"
              disabled={isPaying || isCancelling || remainingSeconds === 0}
              onClick={() => void resumePayment()}
            >
              {isPaying ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Opening payment…
                </>
              ) : (
                <>
                  <LockKeyhole size={18} />
                  Pay now ({formatINR(summary.grandTotal)})
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={isPaying || isCancelling}
              onClick={() => void cancelOrder()}
            >
              {isCancelling ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  Cancelling and restoring cart…
                </>
              ) : (
                <>
                  <ArrowLeft size={16} />
                  Cancel reservation & return to cart
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
          <aside className="rounded-[1.75rem] border border-ink/10 bg-ivory-dim p-5 lg:sticky lg:top-40">
            <h2 className="font-display text-xl! text-ink">Order summary</h2>

            <div className="mt-5 space-y-2.5 border-t border-ink/10 pt-4 text-sm!">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span className="font-mono text-ink">{formatINR(summary.subtotal)}</span>
              </div>
              {summary.itemDiscountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Product savings</span>
                  <span className="font-mono">−{formatINR(summary.itemDiscountAmount)}</span>
                </div>
              )}
              {summary.couponDiscountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span className="flex items-center gap-1.5">
                    Coupon discount
                    {summary.couponCode && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px]! font-semibold uppercase text-green-800">
                        {summary.couponCode}
                      </span>
                    )}
                  </span>
                  <span className="font-mono">−{formatINR(summary.couponDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-soft">
                <span>Prepaid delivery</span>
                <span className="font-mono text-ink">
                  {summary.customerShippingAmount === 0 ? "Free" : formatINR(summary.customerShippingAmount)}
                </span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Tax</span>
                <span className="font-mono text-ink">{formatINR(summary.taxAmount)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-between border-t border-ink/10 pt-4 text-base! font-semibold">
              <span className="text-ink">Total payable</span>
              <span className="font-mono text-xl! text-oxblood">{formatINR(summary.grandTotal)}</span>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl bg-tan/20 p-3 text-xs! text-ink-soft">
              <ShieldCheck size={18} className="shrink-0 text-oxblood" />
              <span>100% secure payment encrypted by {summary.storeName || "Razorpay"}.</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function hasExpired(value: string | null | undefined) {
  if (!value) return false;
  const expiresAt = Date.parse(value);
  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

function getPaymentRequestKey(checkoutSessionId: string) {
  try {
    const value = JSON.parse(sessionStorage.getItem(PAYMENT_REQUEST_KEY) ?? "null") as { checkoutSessionId?: string; key?: string } | null;
    if (value?.checkoutSessionId === checkoutSessionId && value.key) return value.key;
  } catch { /* Stored request state is invalid; create a fresh key. */ }
  const key = crypto.randomUUID();
  sessionStorage.setItem(PAYMENT_REQUEST_KEY, JSON.stringify({ checkoutSessionId, key }));
  return key;
}

type PendingOrder = { checkoutSessionId: string; orderId: string; orderNumber: string; storeName: string; paymentError?: string | null };

function readStoredPendingOrder(): PendingOrder | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(PENDING_ORDER_KEY) ?? "null") as Partial<PendingOrder> | null;
    return value?.checkoutSessionId && value.orderId && value.orderNumber
      ? { checkoutSessionId: value.checkoutSessionId, orderId: value.orderId, orderNumber: value.orderNumber, storeName: value.storeName ?? "", paymentError: value.paymentError }
      : null;
  } catch { return null; }
}

function readPendingOrder(checkoutSessionId: string): Omit<PendingOrder, "checkoutSessionId"> | null {
  const value = readStoredPendingOrder();
  return value?.checkoutSessionId === checkoutSessionId
    ? { orderId: value.orderId, orderNumber: value.orderNumber, storeName: value.storeName, paymentError: value.paymentError }
    : null;
}
