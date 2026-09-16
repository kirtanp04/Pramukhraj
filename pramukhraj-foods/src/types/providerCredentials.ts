export const PROVIDER_KEYS = {
  twilio: 'TWILIO',
  razorpay: 'RAZORPAY',
  shiprocket: 'SHIPROCKET',
  smtp: 'SMTP',
} as const

export interface TwilioCredentials {
  accountSid: string
  authToken: string
  fromNumber: string
  serviceId: string
}

export interface RazorpayCredentials {
  apiKey: string
  keySecret: string
  webhookSecret: string
}

export interface ShiprocketCredentials {
  email: string
  password: string
  webhookSecret: string
}

export interface SmtpCredentials {
  host: string
  port: number
  senderName: string
  senderEmail: string
  username: string
  password: string
}

export interface CreateProviderCredentialRequest<TCredentials = Record<string, unknown>> {
  providerKey: string
  credentials: TCredentials
  isActive: boolean
}

export interface UpdateProviderCredentialRequest<TCredentials = Record<string, unknown>> {
  credentials: TCredentials
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
