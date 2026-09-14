import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StorageKey } from "@/constants/StorageKeys";
import { setCustomerAccessToken } from "@/lib/apiClient";
import { customerAuthApi } from "../services/customerAuthApi";
import type { CompleteProfilePayload, Customer, CustomerAuthResult } from "../types";

interface CustomerAuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isAuthOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  acceptAuth: (result: CustomerAuthResult) => void;
  initialize: () => Promise<void>;
  completeProfile: (payload: CompleteProfilePayload) => Promise<Customer>;
  logout: () => Promise<void>;
  clearSession: () => void;
}

let initializePromise: Promise<void> | null = null;

function saveToken(token: string) { setCustomerAccessToken(token); }
function removeToken() {
  setCustomerAccessToken(null);
  localStorage.removeItem(StorageKey.CustomerAccessToken);
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      isAuthenticated: false,
      isInitialized: false,
      isAuthOpen: false,
      openAuth: () => set({ isAuthOpen: true }),
      closeAuth: () => set({ isAuthOpen: false }),
      acceptAuth: result => {
        saveToken(result.accessToken);
        set({ customer: result.customer, isAuthenticated: true, isInitialized: true });
      },
      initialize: async () => {
        if (get().isInitialized) return;
        localStorage.removeItem(StorageKey.CustomerAccessToken);
        initializePromise ??= (async () => {
          try {
            const result = await customerAuthApi.refresh();
            if (!result) throw new Error("Customer session was not found.");
            saveToken(result.accessToken);
            set({ customer: result.customer, isAuthenticated: true, isInitialized: true });
          } catch {
            removeToken();
            set({ customer: null, isAuthenticated: false, isInitialized: true });
          }
        })().finally(() => { initializePromise = null; });
        return initializePromise;
      },
      completeProfile: async payload => {
        const customer = await customerAuthApi.completeProfile(payload);
        if (!customer) throw new Error("Profile response was not found.");
        set({ customer });
        return customer;
      },
      logout: async () => {
        try { await customerAuthApi.logout(); } finally {
          removeToken();
          set({ customer: null, isAuthenticated: false, isAuthOpen: false });
        }
      },
      clearSession: () => {
        removeToken();
        set({ customer: null, isAuthenticated: false, isAuthOpen: true });
      },
    }),
    {
      name: StorageKey.CustomerAuthState,
      partialize: state => ({ customer: state.customer, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
