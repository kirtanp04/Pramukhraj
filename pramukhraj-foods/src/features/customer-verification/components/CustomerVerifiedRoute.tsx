import { useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { StorageKey } from "@/constants/StorageKeys";
import { useCustomerAuthStore } from "@/features/customer-auth/store/customerAuthStore";
import { useVerificationStore } from "../store/verification.store";

export function CustomerVerifiedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const authenticated = useCustomerAuthStore(state => state.isAuthenticated);
  const initialized = useCustomerAuthStore(state => state.isInitialized);
  const openAuth = useCustomerAuthStore(state => state.openAuth);
  const { status, isLoading, error, load } = useVerificationStore();
  const verificationRequested = useRef(false);
  const [hasCheckedVerification, setHasCheckedVerification] = useState(false);
  useEffect(() => {
    if (!initialized) return;
    if (!authenticated) {
      sessionStorage.setItem(StorageKey.CustomerIntendedPath, `${location.pathname}${location.search}`);
      openAuth();
    } else if (!verificationRequested.current) {
      verificationRequested.current = true;
      void load().finally(() => setHasCheckedVerification(true));
    }
  }, [authenticated, initialized, load, location.pathname, location.search, openAuth]);

  const retry = async () => {
    setHasCheckedVerification(false);
    await load();
    setHasCheckedVerification(true);
  };
  if (!initialized || (authenticated && (!hasCheckedVerification || isLoading))) return <div className="flex min-h-[45vh] items-center justify-center text-sm! text-ink-soft"><LoaderCircle className="mr-2 animate-spin" size={18} />Checking account security…</div>;
  if (!authenticated) return <Navigate to="/" replace />;
  if (error) return <div className="mx-auto max-w-lg px-4 py-20 text-center"><p className="text-sm! text-oxblood">{error}</p><button onClick={() => void retry()} className="mt-4 text-sm! font-semibold text-oxblood underline">Try again</button></div>;
  if (status && !status.isCheckoutEligible) {
    sessionStorage.setItem(StorageKey.CustomerIntendedPath, `${location.pathname}${location.search}`);
    return <Navigate to="/verify-checkout" replace />;
  }
  return children;
}
