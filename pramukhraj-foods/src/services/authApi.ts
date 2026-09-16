import { ApiPath } from "@/constants/apiPaths";
import { apiPost } from "@/lib/apiClient";
import type { AdminUser } from "@/types/admin";

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export const adminAuthApi = {
  login(payload: AdminLoginPayload) {
    return apiPost<AdminUser>(ApiPath.admin.auth.login, payload);
  },

  refresh() {
    return apiPost<AdminUser>(ApiPath.admin.auth.refresh);
  },

  logout() {
    return apiPost<unknown>(ApiPath.admin.auth.logout);
  },
};
