export interface Customer {
  customerId: string;
  mobileNumber: string;
  fullName: string;
  email: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  isProfileCompleted: boolean;
  marketingConsent: boolean;
}

export interface SendOtpResult {
  challengeId: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface CustomerAuthResult {
  accessToken: string;
  expiresInSeconds: number;
  isNewCustomer: boolean;
  customer: Customer;
}

export interface CompleteProfilePayload {
  fullName: string;
  email: string;
  city?: string;
  state?: string;
  postalCode?: string;
  marketingConsent: boolean;
}
