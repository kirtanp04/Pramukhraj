import { useAuthStore } from "@/store/authStore";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export function RequireAuth() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // No session at all — redirect immediately
  if (!isAuthenticated || user === null || user.IsDeleted) {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  //   // Validating stored session — show loader (never flash protected content)
  //   if (status === "idle" || status === "loading") {
  //     return <FullScreenLoader message="Verifying session…" />;
  //   }

  // Authenticated
  return <Outlet />;
}
