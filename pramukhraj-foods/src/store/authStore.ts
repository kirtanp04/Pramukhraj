import { create } from "zustand";
import { initialAuditLog } from "@/mock/auditLog";
import type { AdminUser, AuditLogEntry } from "@/types/admin";
import { adminAuthApi } from "@/services/authApi";
import { setAdminAccessToken } from "@/lib/apiClient";

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  auditLog: AuditLogEntry[];
  loginError: string | null;
  login: (userName: string, password: string) => Promise<boolean>;
  logout: () => void;
  logAction: (action: string, target: string) => void;
  refresh: () => Promise<boolean>;
}

if (typeof window !== "undefined") {
  localStorage.removeItem("pramukhraj-admin-auth");
}

export const useAuthStore = create<AuthState>()(
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

          setAdminAccessToken(res.accessToken);
          set({
            user: res,
            isAuthenticated: true,
            loginError: null,
          });

          return true;
        } catch (error: any) {
          setAdminAccessToken(null);
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
          const res = await adminAuthApi.refresh();

          if (res === null) {
            throw new Error("User response not found");
          }

          setAdminAccessToken(res.accessToken);
          set({
            user: res,
            isAuthenticated: true,
            loginError: null,
          });

          return true;
        } catch (error: any) {
          setAdminAccessToken(null);
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
        setAdminAccessToken(null);
        void adminAuthApi.logout();

        set({
          user: null,
          isAuthenticated: false,
          loginError: null,
        });

        if (userName) {
          get().logAction("Logged out", userName);
        }
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
    })
);
