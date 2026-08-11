import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getRole, roleHasPermission } from "@/mock/roles";
import { initialAuditLog } from "@/mock/auditLog";
import type { AdminUser, AuditLogEntry, Permission } from "@/types/admin";
import { adminAuthApi } from "@/services/authApi";

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  auditLog: AuditLogEntry[];
  loginError: string | null;
  login: (userName: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  logAction: (action: string, target: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      auditLog: initialAuditLog,
      loginError: null,

      login: async (userName, password) => {
        try {
          const res = await adminAuthApi.login({
            password: password,
            username: userName,
          });
          if (res === null) {
            throw new Error("User response not found");
          }
          set({
            user: { ...res },
            isAuthenticated: true,
            loginError: null,
          });
          return true;
        } catch (error: any) {
          set({ loginError: error.message, isAuthenticated: false });
          return false;
        }
      },

      logout: () => {
        const userName = get().user?.Username;
        set({ user: null, isAuthenticated: false });
        if (userName) get().logAction("Logged out", userName);
      },

      hasPermission: permission => {
        const user = get().user;
        if (!user) return false;
        return roleHasPermission(getRole(user.Role), permission);
      },

      logAction: (action, target) => {
        const user = get().user;
        set({
          auditLog: [
            {
              id: `log-${Date.now()}`,
              actor: user?.Username ?? "System",
              action,
              target,
              timestamp: new Date().toISOString(),
              ip: "127.0.0.1",
            },
            ...get().auditLog,
          ],
        });
      },
    }),
    { name: "pramukhraj-admin-auth" }
  )
);
