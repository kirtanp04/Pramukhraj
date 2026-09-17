import { useEffect } from "react";
import { useCheckoutStore } from "../store/checkout.store";
export function useCheckout() {
  const session = useCheckoutStore(state => state.session);
  const isLoading = useCheckoutStore(state => state.isLoading);
  const isMutating = useCheckoutStore(state => state.isMutating);
  const error = useCheckoutStore(state => state.error);
  const initialize = useCheckoutStore(state => state.initialize);
  const chooseAddress = useCheckoutStore(state => state.chooseAddress);
  const applyCoupon = useCheckoutStore(state => state.applyCoupon);
  const removeCoupon = useCheckoutStore(state => state.removeCoupon);
  const refresh = useCheckoutStore(state => state.refresh);
  const reset = useCheckoutStore(state => state.reset);
  useEffect(() => { if (!session && !isLoading && !error) void initialize(); }, [session, isLoading, error, initialize]);
  useEffect(() => {
    const expiresOn = session?.shippingQuote?.quoteExpiresOn;
    if (!expiresOn) return;
    const expiresAt = Date.parse(expiresOn);
    if (!Number.isFinite(expiresAt)) return;

    let cancelled = false;
    let timerId: number | undefined;
    const refreshWhenIdle = () => {
      if (cancelled) return;
      if (useCheckoutStore.getState().isMutating) {
        timerId = window.setTimeout(refreshWhenIdle, 1_000);
        return;
      }
      void refresh().catch(() => undefined);
    };
    timerId = window.setTimeout(refreshWhenIdle, Math.max(0, expiresAt - Date.now() + 250));
    return () => {
      cancelled = true;
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [session?.shippingQuote?.quoteExpiresOn, refresh]);
  return { session, isLoading, isMutating, error, initialize, chooseAddress, applyCoupon, removeCoupon, refresh, reset };
}
