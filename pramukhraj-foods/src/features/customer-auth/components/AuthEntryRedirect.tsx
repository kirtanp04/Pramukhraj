import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useCustomerAuthStore } from "../store/customerAuthStore";

export function AuthEntryRedirect() {
  const openAuth = useCustomerAuthStore(state => state.openAuth);
  useEffect(() => openAuth(), [openAuth]);
  return <Navigate to="/" replace />;
}
