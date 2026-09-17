import { ApiPath } from "@/constants/apiPaths";
import { apiGet, apiPatchResponse, apiPost } from "@/lib/apiClient";
import type { VerificationChallenge, VerificationCodePayload, VerificationStatus } from "../types/verification.types";

type VerificationStatusWire = Partial<VerificationStatus> & {
  isMobileNumberAvailable?: boolean;
  isEmailAddressAvailable?: boolean;
  canProceedToCheckout?: boolean;
  requiredVerification?: string[];
};

export function normalizeVerificationStatus(value: VerificationStatusWire | null): VerificationStatus | null {
  if (!value) return null;
  return {
    hasMobileNumber: value.hasMobileNumber ?? value.isMobileNumberAvailable ?? false,
    isMobileVerified: value.isMobileVerified ?? false,
    maskedMobileNumber: value.maskedMobileNumber ?? null,
    hasEmailAddress: value.hasEmailAddress ?? value.isEmailAddressAvailable ?? false,
    isEmailVerified: value.isEmailVerified ?? false,
    maskedEmailAddress: value.maskedEmailAddress ?? null,
    isCheckoutEligible: value.isCheckoutEligible ?? value.canProceedToCheckout ?? false,
    requiredActions: value.requiredActions ?? value.requiredVerification ?? [],
  };
}

export const verificationApi = {
  status: async () => normalizeVerificationStatus(await apiGet<VerificationStatusWire>(ApiPath.customer.verification.status)),
  requestMobile: () => apiPost<VerificationChallenge>(ApiPath.customer.verification.requestMobile),
  verifyMobile: async (payload: VerificationCodePayload) => normalizeVerificationStatus(
    await apiPost<VerificationStatusWire>(ApiPath.customer.verification.verifyMobile, payload)),
  updateEmail: async (email: string) => normalizeVerificationStatus(
    (await apiPatchResponse<VerificationStatusWire>(ApiPath.customer.verification.updateEmail, { email })).data),
  requestEmail: () => apiPost<VerificationChallenge>(ApiPath.customer.verification.requestEmail),
  verifyEmail: async (payload: VerificationCodePayload) => normalizeVerificationStatus(
    await apiPost<VerificationStatusWire>(ApiPath.customer.verification.verifyEmail, payload)),
};
