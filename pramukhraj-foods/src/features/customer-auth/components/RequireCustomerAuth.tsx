import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useCustomerAuthStore } from "../store/customerAuthStore";

export function RequireCustomerAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useCustomerAuthStore(state => state.isAuthenticated);
  const isInitialized = useCustomerAuthStore(state => state.isInitialized);
  const openAuth = useCustomerAuthStore(state => state.openAuth);
  useEffect(() => { if (isInitialized && !isAuthenticated) openAuth(); }, [isAuthenticated, isInitialized, openAuth]);
  if (!isInitialized) return null;
  return isAuthenticated ? children : <Navigate to="/" replace />;
}
