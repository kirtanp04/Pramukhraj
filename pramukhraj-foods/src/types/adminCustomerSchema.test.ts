import { describe, expect, it } from 'vitest'
import { adminCustomerPatchSchema } from './adminCustomerSchema'

const validCustomer = {
  fullName: 'Asha Patel',
  email: 'asha@example.com',
  city: 'Ahmedabad',
  state: 'Gujarat',
  postalCode: '380001',
  marketingConsent: true,
  status: 'ACTIVE' as const,
  blockReason: '',
  concurrencyStamp: 'a'.repeat(32),
}

describe('adminCustomerPatchSchema', () => {
  it('accepts a valid customer update', () => {
    expect(adminCustomerPatchSchema.safeParse(validCustomer).success).toBe(true)
  })

  it('requires a reason when a customer is blocked', () => {
    const result = adminCustomerPatchSchema.safeParse({ ...validCustomer, status: 'BLOCKED' })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.flatten().fieldErrors.blockReason).toContain('Block reason is required.')
  })

  it('rejects invalid email and concurrency values', () => {
    const result = adminCustomerPatchSchema.safeParse({ ...validCustomer, email: 'invalid', concurrencyStamp: 'short' })

    expect(result.success).toBe(false)
  })
})
