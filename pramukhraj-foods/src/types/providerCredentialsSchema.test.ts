import { describe, expect, it } from 'vitest'
import {
  DEFAULT_RAZORPAY_CREDENTIALS,
  DEFAULT_TWILIO_CREDENTIALS,
  DEFAULT_SHIPROCKET_CREDENTIALS,
  razorpayCredentialsSchema,
  shiprocketCredentialsSchema,
  twilioCredentialsSchema,
  smtpCredentialsSchema,
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

describe('smtpCredentialsSchema', () => {
  const valid = { host: 'smtp.gmail.com', port: 587, senderName: 'Pramukhraj Foods', senderEmail: 'store@example.com', username: 'store@example.com', password: 'app-password' }

  it('accepts and trims complete SMTP settings', () => {
    const result = smtpCredentialsSchema.safeParse({ ...valid, host: ' smtp.gmail.com ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.host).toBe('smtp.gmail.com')
  })

  it('rejects invalid ports and email addresses', () => {
    expect(smtpCredentialsSchema.safeParse({ ...valid, port: 0 }).success).toBe(false)
    expect(smtpCredentialsSchema.safeParse({ ...valid, senderEmail: 'invalid' }).success).toBe(false)
  })
})

describe('razorpayCredentialsSchema', () => {
  it('accepts all three required credentials and trims them', () => {
    const result = razorpayCredentialsSchema.safeParse({
      apiKey: ' rzp_test_123 ',
      keySecret: ' key-secret ',
      webhookSecret: ' webhook-secret ',
      isUpiPaymentEnabled: true,
      isCardPaymentEnabled: false,
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

  it('requires UPI or card payments to be enabled', () => {
    expect(razorpayCredentialsSchema.safeParse({
      apiKey: 'rzp_test_123', keySecret: 'key-secret', webhookSecret: 'webhook-secret',
      isUpiPaymentEnabled: false, isCardPaymentEnabled: false,
    }).success).toBe(false)
  })
})

describe('shiprocketCredentialsSchema', () => {
  it('accepts and trims all five required settings', () => {
    const result = shiprocketCredentialsSchema.safeParse({
      ...DEFAULT_SHIPROCKET_CREDENTIALS,
      email: ' admin@example.com ',
      password: ' password-secret ',
      webhookSecret: ' webhook-secret ',
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('admin@example.com')
  })

  it.each(['email', 'password', 'webhookSecret', 'pickupPostalCode'] as const)('requires %s', field => {
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
      ...DEFAULT_SHIPROCKET_CREDENTIALS,
      email: 'not-an-email',
      password: 'password-secret',
      webhookSecret: 'webhook-secret',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid pickup PIN and minimum chargeable weight values', () => {
    expect(shiprocketCredentialsSchema.safeParse({ ...DEFAULT_SHIPROCKET_CREDENTIALS, email: 'admin@example.com', password: 'password-secret', webhookSecret: 'webhook-secret', pickupPostalCode: '000000' }).success).toBe(false)
    expect(shiprocketCredentialsSchema.safeParse({ ...DEFAULT_SHIPROCKET_CREDENTIALS, email: 'admin@example.com', password: 'password-secret', webhookSecret: 'webhook-secret', minimumChargeableWeightKg: 0 }).success).toBe(false)
  })
})
