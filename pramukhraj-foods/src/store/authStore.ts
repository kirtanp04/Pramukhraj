import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getRole, getRoleIdByName, roleHasPermission } from "@/mock/roles";
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
  refresh: () => Promise<boolean>;
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
            username: userName,
            password,
          });

          if (res === null) {
            throw new Error("User response not found");
          }

          if (!getRoleIdByName(res.role)) {
            throw new Error("Your account has an unrecognized role.");
          }

          set({
            user: res,
            isAuthenticated: true,
            loginError: null,
          });

          return true;
        } catch (error: any) {
          set({
            loginError: error.message,
            isAuthenticated: false,
            user: null,
          });

          return false;
        }
      },

      refresh: async () => {
        try {
          const user = get().user;

          if (
            user === null ||
            user.refreshToken === undefined ||
            user.refreshToken === null ||
            user.refreshToken === ""
          ) {
            set({
              loginError: "Refresh tooken not found",
              isAuthenticated: false,
              user: null,
            });

            return false;
          }
          const res = await adminAuthApi.refresh({
            refreshToken: user.refreshToken,
          });

          if (res === null) {
            throw new Error("User response not found");
          }

          if (!getRoleIdByName(res.role)) {
            throw new Error("Your account has an unrecognized role.");
          }

          set({
            user: res,
            isAuthenticated: true,
            loginError: null,
          });

          return true;
        } catch (error: any) {
          set({
            loginError: error.message,
            isAuthenticated: false,
            user: null,
          });

          return false;
        }
      },

      logout: () => {
        const userName = get().user?.username;

        set({
          user: null,
          isAuthenticated: false,
          loginError: null,
        });

        if (userName) {
          get().logAction("Logged out", userName);
        }
      },

      hasPermission: permission => {
        const user = get().user;

        if (!user) return false;

        const roleId = getRoleIdByName(user.role);

        return roleHasPermission(getRole(roleId ?? ""), permission);
      },

      logAction: (action, target) => {
        const user = get().user;

        set({
          auditLog: [
            {
              id: `log-${Date.now()}`,
              actor: user?.username ?? "System",
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
    {
      name: "pramukhraj-admin-auth",
      version: 3,
      partialize: state => ({
        user: state.user
          ? {
              accessToken: state.user.accessToken,
              refreshToken: state.user.refreshToken,
            }
          : null,
      }),
    }
  )
);
