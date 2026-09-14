import { ApiPath } from "@/constants/apiPaths";
import { apiGet, apiPost } from "@/lib/apiClient";
import type { CompleteProfilePayload, Customer, CustomerAuthResult, SendOtpResult } from "../types";

export const customerAuthApi = {
  sendOtp(mobileNumber: string) {
    return apiPost<SendOtpResult>(ApiPath.customer.auth.sendOtp, { mobileNumber });
  },
  verifyOtp(challengeId: string, mobileNumber: string, code: string) {
    return apiPost<CustomerAuthResult>(ApiPath.customer.auth.verifyOtp, {
      challengeId, mobileNumber, code, deviceName: navigator.userAgent.slice(0, 200),
    });
  },
  refresh() {
    return apiPost<CustomerAuthResult>(ApiPath.customer.auth.refreshToken);
  },
  completeProfile(payload: CompleteProfilePayload) {
    return apiPost<Customer>(ApiPath.customer.auth.completeProfile, payload);
  },
  me() {
    return apiGet<Customer>(ApiPath.customer.auth.me);
  },
  logout() {
    return apiPost<unknown>(ApiPath.customer.auth.logout);
  },
};
