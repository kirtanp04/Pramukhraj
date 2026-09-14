import { describe, expect, it } from 'vitest'
import { DEFAULT_TWILIO_CREDENTIALS, twilioCredentialsSchema } from '@/types/providerCredentialsSchema'

describe('twilioCredentialsSchema', () => {
  it('accepts the three required values without a service ID', () => {
    expect(twilioCredentialsSchema.safeParse({
      accountSid: 'AC123',
      authToken: 'secret',
      fromNumber: '+17372508034',
      serviceId: '',
    }).success).toBe(true)
  })

  it.each(['accountSid', 'authToken', 'fromNumber'] as const)('requires %s', field => {
    const result = twilioCredentialsSchema.safeParse({
      ...DEFAULT_TWILIO_CREDENTIALS,
      accountSid: 'AC123',
      authToken: 'secret',
      fromNumber: '+17372508034',
      [field]: '   ',
    })
    expect(result.success).toBe(false)
  })
})
