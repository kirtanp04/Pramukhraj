import { useEffect } from "react";
import { useVerificationStore } from "../store/verification.store";

export function useVerificationStatus() {
  const status = useVerificationStore(state => state.status);
  const isLoading = useVerificationStore(state => state.isLoading);
  const error = useVerificationStore(state => state.error);
  const load = useVerificationStore(state => state.load);
  const setStatus = useVerificationStore(state => state.setStatus);
  const clear = useVerificationStore(state => state.clear);
  useEffect(() => { if (!status && !isLoading && !error) void load(); }, [status, isLoading, error, load]);
  return { status, isLoading, error, load, setStatus, clear };
}
