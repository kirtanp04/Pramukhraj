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
  isUpiPaymentEnabled: z.boolean(),
  isCardPaymentEnabled: z.boolean(),
}).refine(value => value.isUpiPaymentEnabled || value.isCardPaymentEnabled, {
  message: 'Enable at least one payment method: UPI or card.',
  path: ['isUpiPaymentEnabled'],
})

export type RazorpayCredentialsFormValues = z.infer<typeof razorpayCredentialsSchema>

export const DEFAULT_RAZORPAY_CREDENTIALS: RazorpayCredentialsFormValues = {
  apiKey: '',
  keySecret: '',
  webhookSecret: '',
  isUpiPaymentEnabled: true,
  isCardPaymentEnabled: true,
}

export const shiprocketCredentialsSchema = z.object({
  email: requiredCredential('Email').pipe(z.email('Enter a valid email address.')),
  password: requiredCredential('Password'),
  webhookSecret: requiredCredential('Webhook secret'),
  pickupPostalCode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit Indian pickup PIN code.'),
  pickupLocation: z.string().trim().max(100, 'Pickup location cannot exceed 100 characters.').optional().or(z.literal('')),
  minimumChargeableWeightKg: z.number({ error: 'Minimum chargeable weight is required.' })
    .min(0.1, 'Minimum chargeable weight must be at least 0.1 kg.')
    .max(100, 'Minimum chargeable weight cannot exceed 100 kg.'),
})

export type ShiprocketCredentialsFormValues = z.infer<typeof shiprocketCredentialsSchema>

export const DEFAULT_SHIPROCKET_CREDENTIALS: ShiprocketCredentialsFormValues = {
  email: '',
  password: '',
  webhookSecret: '',
  pickupPostalCode: '388001',
  pickupLocation: '',
  minimumChargeableWeightKg: 0.5,
}

export const smtpCredentialsSchema = z.object({
  host: requiredCredential('SMTP host').max(253, 'SMTP host cannot exceed 253 characters.'),
  port: z.number({ error: 'SMTP port is required.' }).int('SMTP port must be a whole number.')
    .min(1, 'SMTP port must be between 1 and 65535.')
    .max(65535, 'SMTP port must be between 1 and 65535.'),
  senderName: requiredCredential('Sender name').max(120, 'Sender name cannot exceed 120 characters.'),
  senderEmail: requiredCredential('Sender email').pipe(z.email('Enter a valid sender email address.')),
  username: requiredCredential('Username').pipe(z.email('Enter a valid SMTP username.')),
  password: requiredCredential('Password'),
})

export type SmtpCredentialsFormValues = z.infer<typeof smtpCredentialsSchema>

export const DEFAULT_SMTP_CREDENTIALS: SmtpCredentialsFormValues = {
  host: 'smtp.gmail.com',
  port: 587,
  senderName: 'Pramukhraj Foods',
  senderEmail: '',
  username: '',
  password: '',
}
