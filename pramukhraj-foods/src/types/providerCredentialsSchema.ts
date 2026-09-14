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
