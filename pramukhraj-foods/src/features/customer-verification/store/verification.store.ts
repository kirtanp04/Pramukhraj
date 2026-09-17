import { create } from "zustand";
import { getApiErrorMessage } from "@/lib/apiClient";
import { verificationApi } from "../api/verification.api";
import type { VerificationStatus } from "../types/verification.types";

interface VerificationStore {
  status: VerificationStatus | null;
  isLoading: boolean;
  error: string | null;
  load: () => Promise<VerificationStatus | null>;
  setStatus: (status: VerificationStatus) => void;
  clear: () => void;
}

export const useVerificationStore = create<VerificationStore>(set => ({
  status: null,
  isLoading: false,
  error: null,
  load: async () => {
    set({ isLoading: true, error: null });
    try {
      const status = await verificationApi.status();
      set({ status, isLoading: false });
      return status;
    } catch (error) {
      set({ error: getApiErrorMessage(error), isLoading: false });
      return null;
    }
  },
  setStatus: status => set({ status, error: null }),
  clear: () => set({ status: null, error: null, isLoading: false }),
}));
