import {  Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { lazyNamed } from '@/routes/lazyNamed';

const AdminLogin = lazyNamed(
  () => import("@/pages/admin/AdminLogin"),
  "AdminLogin"
);

export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
 

   if (!isAuthenticated || user === null || user.isDeleted) {
    return <AdminLogin />;
  }
  return <Outlet />
}
