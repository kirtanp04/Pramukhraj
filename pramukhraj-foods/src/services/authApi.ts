import { ApiPath } from "@/constants/apiPaths";
import { apiPost } from "@/lib/apiClient";
import type { AdminUser } from "@/types/admin";

export interface AdminLoginPayload {
  username: string;
  password: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

export const adminAuthApi = {
  login(payload: AdminLoginPayload) {
    return apiPost<AdminUser>(ApiPath.admin.auth.login, payload);
  },

  refresh(payload: RefreshPayload) {
    return apiPost<AdminUser>(ApiPath.admin.auth.refresh, payload);
  },
};
