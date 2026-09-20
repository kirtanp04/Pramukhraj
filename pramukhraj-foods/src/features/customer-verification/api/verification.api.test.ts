import { describe, expect, it } from "vitest";
import { normalizeVerificationStatus } from "./verification.api";

describe("normalizeVerificationStatus", () => {
  it("maps the legacy backend eligibility fields", () => {
    const status = normalizeVerificationStatus({
      isMobileNumberAvailable: true,
      isMobileVerified: true,
      maskedMobileNumber: "+91******4483",
      isEmailAddressAvailable: true,
      isEmailVerified: true,
      maskedEmailAddress: "k***@gmail.com",
      canProceedToCheckout: true,
      requiredVerification: [],
    });

    expect(status).toMatchObject({
      hasMobileNumber: true,
      hasEmailAddress: true,
      isCheckoutEligible: true,
      requiredActions: [],
    });
  });

  it("keeps the canonical eligibility fields", () => {
    const status = normalizeVerificationStatus({
      hasMobileNumber: true,
      isMobileVerified: true,
      maskedMobileNumber: "+91******4483",
      hasEmailAddress: true,
      isEmailVerified: true,
      maskedEmailAddress: "k***@gmail.com",
      isCheckoutEligible: true,
      requiredActions: [],
    });

    expect(status?.isCheckoutEligible).toBe(true);
  });
});
