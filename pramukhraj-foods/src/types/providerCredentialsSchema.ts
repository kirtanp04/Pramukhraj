import { z } from 'zod'

const requiredCredential = (label: string) => z.string()
  .trim()
  .min(1, `${label} is required.`)
  .max(500, `${label} cannot exceed 500 characters.`)

export const twilioCredentialsSchema = z.object({
  accountSid: requiredCredential('Account SID'),
  authToken: requiredCredential('Auth token'),
  fromNumber: requiredCredential('From number'),
  serviceId: z.string().trim().max(500, 'Service ID cannot exceed 500 characters.'),
})

export type TwilioCredentialsFormValues = z.infer<typeof twilioCredentialsSchema>

export const DEFAULT_TWILIO_CREDENTIALS: TwilioCredentialsFormValues = {
  accountSid: '',
  authToken: '',
  fromNumber: '',
  serviceId: '',
}

export const razorpayCredentialsSchema = z.object({
  apiKey: requiredCredential('API key'),
  keySecret: requiredCredential('Key secret'),
  webhookSecret: requiredCredential('Webhook secret'),
})

export type RazorpayCredentialsFormValues = z.infer<typeof razorpayCredentialsSchema>

export const DEFAULT_RAZORPAY_CREDENTIALS: RazorpayCredentialsFormValues = {
  apiKey: '',
  keySecret: '',
  webhookSecret: '',
}

export const shiprocketCredentialsSchema = z.object({
  email: requiredCredential('Email').pipe(z.email('Enter a valid email address.')),
  password: requiredCredential('Password'),
  webhookSecret: requiredCredential('Webhook secret'),
})

export type ShiprocketCredentialsFormValues = z.infer<typeof shiprocketCredentialsSchema>

export const DEFAULT_SHIPROCKET_CREDENTIALS: ShiprocketCredentialsFormValues = {
  email: '',
  password: '',
  webhookSecret: '',
}
