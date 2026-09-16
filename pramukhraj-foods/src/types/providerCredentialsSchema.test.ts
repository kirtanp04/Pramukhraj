import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RAZORPAY_CREDENTIALS,
  DEFAULT_TWILIO_CREDENTIALS,
  DEFAULT_SHIPROCKET_CREDENTIALS,
  razorpayCredentialsSchema,
  shiprocketCredentialsSchema,
  twilioCredentialsSchema,
} from '@/types/providerCredentialsSchema'

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

describe('razorpayCredentialsSchema', () => {
  it('accepts all three required credentials and trims them', () => {
    const result = razorpayCredentialsSchema.safeParse({
      apiKey: ' rzp_test_123 ',
      keySecret: ' key-secret ',
      webhookSecret: ' webhook-secret ',
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.apiKey).toBe('rzp_test_123')
  })

  it.each(['apiKey', 'keySecret', 'webhookSecret'] as const)('requires %s', field => {
    const result = razorpayCredentialsSchema.safeParse({
      ...DEFAULT_RAZORPAY_CREDENTIALS,
      apiKey: 'rzp_test_123',
      keySecret: 'key-secret',
      webhookSecret: 'webhook-secret',
      [field]: '   ',
    })
    expect(result.success).toBe(false)
  })
})

describe('shiprocketCredentialsSchema', () => {
  it('accepts and trims all three credentials', () => {
    const result = shiprocketCredentialsSchema.safeParse({
      email: ' admin@example.com ',
      password: ' password-secret ',
      webhookSecret: ' webhook-secret ',
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('admin@example.com')
  })

  it.each(['email', 'password', 'webhookSecret'] as const)('requires %s', field => {
    const result = shiprocketCredentialsSchema.safeParse({
      ...DEFAULT_SHIPROCKET_CREDENTIALS,
      email: 'admin@example.com',
      password: 'password-secret',
      webhookSecret: 'webhook-secret',
      [field]: '   ',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid email address', () => {
    const result = shiprocketCredentialsSchema.safeParse({
      email: 'not-an-email',
      password: 'password-secret',
      webhookSecret: 'webhook-secret',
    })
    expect(result.success).toBe(false)
  })
})
