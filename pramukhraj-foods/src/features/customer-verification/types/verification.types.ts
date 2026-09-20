export interface VerificationStatus {
  hasMobileNumber: boolean;
  isMobileVerified: boolean;
  maskedMobileNumber: string | null;
  hasEmailAddress: boolean;
  isEmailVerified: boolean;
  maskedEmailAddress: string | null;
  isCheckoutEligible: boolean;
  requiredActions: string[];
}

export interface VerificationChallenge {
  challengeId: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface VerificationCodePayload { challengeId: string; code: string }
