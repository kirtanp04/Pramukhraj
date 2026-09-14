export const PROVIDER_KEYS = {
  twilio: 'TWILIO',
} as const

export interface TwilioCredentials {
  accountSid: string
  authToken: string
  fromNumber: string
  serviceId: string
}

export interface CreateProviderCredentialRequest {
  providerKey: string
  credentials: TwilioCredentials
  isActive: boolean
}

export interface UpdateProviderCredentialRequest {
  credentials: TwilioCredentials
  isActive: boolean
}

export interface ProviderCredentialResponse<TCredentials = Record<string, unknown>> {
  id: string
  providerKey: string
  credentials: TCredentials
  isActive: boolean
  createdOn: string
  updatedOn: string | null
}
