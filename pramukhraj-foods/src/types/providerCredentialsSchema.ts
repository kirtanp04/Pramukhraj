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
