import { create } from "zustand";
import { StorageKey } from "@/constants/StorageKeys";
import { getApiErrorMessage } from "@/lib/apiClient";
import { checkoutApi } from "../api/checkout.api";
import type { CheckoutSession } from "../types/checkout.types";

interface CheckoutStore {
  session: CheckoutSession | null; isLoading: boolean; isMutating: boolean; error: string;
  initialize: () => Promise<void>; chooseAddress: (shippingId: string | null, billingId: string | null) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>; removeCoupon: () => Promise<void>; refresh: () => Promise<CheckoutSession | null>; reset: () => void;
}

export const useCheckoutStore = create<CheckoutStore>((set, get) => {
  const change = async (operation: (session: CheckoutSession) => Promise<CheckoutSession | null>) => {
    const current = get().session; if (!current) return;
    set({ isMutating: true, error: "" });
    try { const next = await operation(current); if (!next) throw new Error("Checkout response was empty."); set({ session: next }); }
    catch (error) {
      const message = getApiErrorMessage(error);
      try {
        const latest = await checkoutApi.get(current.checkoutSessionId);
        set({ session: latest, error: message });
      } catch { set({ error: message }); }
      throw new Error(message);
    }
    finally { set({ isMutating: false }); }
  };
  return {
    session: null, isLoading: false, isMutating: false, error: "",
    initialize: async () => {
      if (get().isLoading) return;
      set({ isLoading: true, error: "" });
      try {
        const storedId = sessionStorage.getItem(StorageKey.CheckoutSessionId);
        let session: CheckoutSession | null = null;
        if (storedId) { try { session = await checkoutApi.get(storedId); } catch { sessionStorage.removeItem(StorageKey.CheckoutSessionId); } }
        session ??= await checkoutApi.initialize();
        if (!session) throw new Error("Checkout could not be initialized.");
        sessionStorage.setItem(StorageKey.CheckoutSessionId, session.checkoutSessionId);
        set({ session });
      } catch (error) { set({ error: getApiErrorMessage(error), session: null }); }
      finally { set({ isLoading: false }); }
    },
    chooseAddress: (shippingId, billingId) => change(session => checkoutApi.updateAddress(session.checkoutSessionId, shippingId, billingId)),
    applyCoupon: code => change(session => checkoutApi.applyCoupon(session.checkoutSessionId, code)),
    removeCoupon: () => change(session => checkoutApi.removeCoupon(session.checkoutSessionId)),
    refresh: async () => { await change(session => checkoutApi.refresh(session.checkoutSessionId)); return get().session; },
    reset: () => { sessionStorage.removeItem(StorageKey.CheckoutSessionId); set({ session: null, error: "", isLoading: false, isMutating: false }); },
  };
});
