import { describe, expect, it } from 'vitest'
import { DEFAULT_STORE_SETTINGS, storeSettingsSchema } from './storeSettingsSchema'

const validData = () => ({
  ...DEFAULT_STORE_SETTINGS,
  storeName: 'Pramukhraj Foods',
  supportEmail: 'support@pramukhraj.com',
  supportPhoneNumber: '+919876543210',
  storeAddress: '123 Market Street, Ahmedabad, Gujarat',
  taxRatePercent: 0,
  paymentServiceTaxRatePercent: 2,
  freeShippingMinimumAmount: 500,
  returnWindowDays: 0,
})

describe('storeSettingsSchema', () => {
  it('has DEFAULT_STORE_SETTINGS configured with returnWindowDays = 0', () => {
    expect(DEFAULT_STORE_SETTINGS.returnWindowDays).toBe(0)
  })

  it('accepts returnWindowDays = 0 (returns not applicable)', () => {
    const data = validData()
    data.returnWindowDays = 0
    const result = storeSettingsSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.returnWindowDays).toBe(0)
    }
  })

  it('accepts positive integer return window up to 365 days', () => {
    const data = validData()
    data.returnWindowDays = 14
    const result = storeSettingsSchema.safeParse(data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.returnWindowDays).toBe(14)
    }

    data.returnWindowDays = 365
    expect(storeSettingsSchema.safeParse(data).success).toBe(true)
  })

  it('rejects non-numeric return window days', () => {
    const data = { ...validData(), returnWindowDays: 'invalid' as unknown as number }
    const result = storeSettingsSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects negative return window days', () => {
    const data = validData()
    data.returnWindowDays = -1
    const result = storeSettingsSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects floating point return window days', () => {
    const data = validData()
    data.returnWindowDays = 2.5
    const result = storeSettingsSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('rejects return window days exceeding 365', () => {
    const data = validData()
    data.returnWindowDays = 366
    const result = storeSettingsSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it('requires returnWindowDays to be provided', () => {
    const data = validData()
    delete (data as Partial<typeof data>).returnWindowDays
    const result = storeSettingsSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})
