import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { StorageKey } from "@/constants/StorageKeys";
import { useCustomerAuthStore } from "../store/customerAuthStore";

export function RequireCustomerAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useCustomerAuthStore(state => state.isAuthenticated);
  const isInitialized = useCustomerAuthStore(state => state.isInitialized);
  const openAuth = useCustomerAuthStore(state => state.openAuth);
  const location = useLocation();
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      sessionStorage.setItem(StorageKey.CustomerIntendedPath, `${location.pathname}${location.search}`);
      openAuth();
    }
  }, [isAuthenticated, isInitialized, location.pathname, location.search, openAuth]);
  if (!isInitialized) return null;
  return isAuthenticated ? children : <Navigate to="/" replace />;
}
