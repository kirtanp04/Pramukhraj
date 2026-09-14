import { useEffect } from "react";
import { useCustomerAuthStore } from "../store/customerAuthStore";

export function useCustomerSession() {
  const initialize = useCustomerAuthStore(state => state.initialize);
  const clearSession = useCustomerAuthStore(state => state.clearSession);

  useEffect(() => {
    void initialize();
    window.addEventListener("customer-auth-expired", clearSession);
    return () => window.removeEventListener("customer-auth-expired", clearSession);
  }, [clearSession, initialize]);
}
