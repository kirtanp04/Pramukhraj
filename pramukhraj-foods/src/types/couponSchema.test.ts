import { describe, expect, it } from 'vitest'
import { couponFormSchema, DEFAULT_COUPON_VALUES, mapCouponFormToRequest } from '@/types/couponSchema'

const valid = () => ({
  ...structuredClone(DEFAULT_COUPON_VALUES),
  code: 'WELCOME20',
  name: 'Welcome offer',
})

describe('couponFormSchema', () => {
  it('provides the required add-form defaults', () => {
    expect(DEFAULT_COUPON_VALUES).toMatchObject({
      discountType: 'Percentage', applicationScope: 'AllProducts', minimumOrderAmount: 0,
      isFirstOrderOnly: false, canCombineWithOtherDiscounts: false, isActive: true,
    })
  })

  it('rejects percentages outside 1 through 100', () => {
    const values = valid()
    values.discountValue = 101
    expect(couponFormSchema.safeParse(values).success).toBe(false)
  })

  it('requires zero value for free shipping', () => {
    const values = valid()
    values.discountType = 'FreeShipping'
    values.discountValue = 1
    expect(couponFormSchema.safeParse(values).success).toBe(false)
  })

  it('does not allow maximum discount for flat coupons', () => {
    const values = valid()
    values.discountType = 'FlatAmount'
    values.discountValue = 50
    values.maximumDiscountAmount = 25
    expect(couponFormSchema.safeParse(values).success).toBe(false)
  })

  it('requires products for a product-scoped coupon', () => {
    const values = valid()
    values.applicationScope = 'SpecificProducts'
    expect(couponFormSchema.safeParse(values).success).toBe(false)
  })

  it('accepts a unique valid product selection', () => {
    const values = valid()
    values.applicationScope = 'SpecificProducts'
    values.productIds = ['63bc8ef7-8133-4ed0-961f-a7be21fb7df2']
    expect(couponFormSchema.safeParse(values).success).toBe(true)
  })

  it('rejects categories on an all-products coupon', () => {
    const values = valid()
    values.categoryIds = ['63bc8ef7-8133-4ed0-961f-a7be21fb7df2']
    expect(couponFormSchema.safeParse(values).success).toBe(false)
  })

  it('rejects an end date before the start date', () => {
    const values = valid()
    values.endOn = values.startOn
    expect(couponFormSchema.safeParse(values).success).toBe(false)
  })

  it('rejects per-customer usage above the total usage limit', () => {
    const values = valid()
    values.totalUsageLimit = 5
    values.perCustomerUsageLimit = 6
    expect(couponFormSchema.safeParse(values).success).toBe(false)
  })

  it('normalizes code and dates for the API', () => {
    const values = valid()
    values.code = ' welcome_20 '
    const request = mapCouponFormToRequest(values)
    expect(request.code).toBe('WELCOME_20')
    expect(request.startOn.endsWith('Z')).toBe(true)
    expect(request.endOn.endsWith('Z')).toBe(true)
  })
})
