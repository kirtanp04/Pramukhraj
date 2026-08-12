import { lazyNamed } from "@/routes/lazyNamed";
import { useAuthStore } from "@/store/authStore";
import { Outlet } from "react-router-dom";

const AdminLogin = lazyNamed(
  () => import("@/pages/admin/AdminLogin"),
  "AdminLogin"
);

export function RequireAuth() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user === null || user.isDeleted) {
    return <AdminLogin />;
  }

  return <Outlet />;
}
