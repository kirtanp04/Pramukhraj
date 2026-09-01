import { z } from 'zod'
import type { CouponWriteRequest } from '@/types/coupon'

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const couponFormSchema = z.object({
  code: z.string().trim().min(3, 'Code must contain at least 3 characters.').max(50).regex(/^[A-Za-z0-9_-]+$/, 'Use only letters, numbers, hyphens and underscores.'),
  name: z.string().trim().min(1, 'Coupon name is required.').max(150),
  description: z.string().trim().max(1000),
  discountType: z.enum(['Percentage', 'FlatAmount', 'FreeShipping']),
  discountValue: z.number({ error: 'Enter a valid discount value.' }),
  minimumOrderAmount: z.number({ error: 'Enter a valid minimum order.' }).min(0, 'Minimum order cannot be negative.'),
  maximumDiscountAmount: z.number().positive('Maximum discount must be greater than 0.').nullable(),
  applicationScope: z.enum(['AllProducts', 'SpecificProducts', 'SpecificCategories']),
  productIds: z.array(z.string().regex(guidPattern, 'A selected product is invalid.')),
  categoryIds: z.array(z.string().regex(guidPattern, 'A selected category is invalid.')),
  totalUsageLimit: z.number().int().positive('Total usage limit must be greater than 0.').nullable(),
  perCustomerUsageLimit: z.number().int().positive('Per-customer limit must be greater than 0.').nullable(),
  isFirstOrderOnly: z.boolean(),
  canCombineWithOtherDiscounts: z.boolean(),
  startOn: z.string().min(1, 'Start date and time are required.'),
  endOn: z.string().min(1, 'End date and time are required.'),
  isActive: z.boolean(),
}).superRefine((data, context) => {
  if (data.discountType === 'Percentage' && (data.discountValue <= 0 || data.discountValue > 100)) {
    context.addIssue({ code: 'custom', path: ['discountValue'], message: 'Percentage must be greater than 0 and at most 100.' })
  }
  if (data.discountType === 'FlatAmount' && data.discountValue <= 0) {
    context.addIssue({ code: 'custom', path: ['discountValue'], message: 'Flat discount must be greater than 0.' })
  }
  if (data.discountType === 'FreeShipping' && data.discountValue !== 0) {
    context.addIssue({ code: 'custom', path: ['discountValue'], message: 'Free shipping must have a discount value of 0.' })
  }
  if (data.discountType !== 'Percentage' && data.maximumDiscountAmount !== null) {
    context.addIssue({ code: 'custom', path: ['maximumDiscountAmount'], message: 'Maximum discount applies only to percentage coupons.' })
  }
  if (data.perCustomerUsageLimit !== null && data.totalUsageLimit !== null && data.perCustomerUsageLimit > data.totalUsageLimit) {
    context.addIssue({ code: 'custom', path: ['perCustomerUsageLimit'], message: 'Per-customer limit cannot exceed the total limit.' })
  }
  if (new Date(data.startOn).getTime() >= new Date(data.endOn).getTime()) {
    context.addIssue({ code: 'custom', path: ['endOn'], message: 'End date must be after the start date.' })
  }
  if (new Set(data.productIds).size !== data.productIds.length) {
    context.addIssue({ code: 'custom', path: ['productIds'], message: 'Duplicate products are not allowed.' })
  }
  if (new Set(data.categoryIds).size !== data.categoryIds.length) {
    context.addIssue({ code: 'custom', path: ['categoryIds'], message: 'Duplicate categories are not allowed.' })
  }
  if (data.applicationScope === 'AllProducts' && (data.productIds.length > 0 || data.categoryIds.length > 0)) {
    context.addIssue({ code: 'custom', path: ['applicationScope'], message: 'All-products coupons cannot contain scope selections.' })
  }
  if (data.applicationScope === 'SpecificProducts') {
    if (data.productIds.length === 0) context.addIssue({ code: 'custom', path: ['productIds'], message: 'Select at least one product.' })
    if (data.categoryIds.length > 0) context.addIssue({ code: 'custom', path: ['categoryIds'], message: 'Clear category selections.' })
  }
  if (data.applicationScope === 'SpecificCategories') {
    if (data.categoryIds.length === 0) context.addIssue({ code: 'custom', path: ['categoryIds'], message: 'Select at least one category.' })
    if (data.productIds.length > 0) context.addIssue({ code: 'custom', path: ['productIds'], message: 'Clear product selections.' })
  }
})

export type CouponFormValues = z.infer<typeof couponFormSchema>

function toDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const start = new Date(Date.now() + 5 * 60_000)
const end = new Date(start.getTime() + 30 * 24 * 60 * 60_000)

export const DEFAULT_COUPON_VALUES: CouponFormValues = {
  code: '', name: '', description: '', discountType: 'Percentage', discountValue: 10,
  minimumOrderAmount: 0, maximumDiscountAmount: null, applicationScope: 'AllProducts',
  productIds: [], categoryIds: [], totalUsageLimit: null, perCustomerUsageLimit: null,
  isFirstOrderOnly: false, canCombineWithOtherDiscounts: false,
  startOn: toDateTimeLocal(start), endOn: toDateTimeLocal(end), isActive: true,
}

export function mapCouponToForm(coupon: CouponWriteRequest): CouponFormValues {
  return {
    ...coupon,
    description: coupon.description ?? '',
    startOn: toDateTimeLocal(new Date(coupon.startOn)),
    endOn: toDateTimeLocal(new Date(coupon.endOn)),
  }
}

export function mapCouponFormToRequest(values: CouponFormValues): CouponWriteRequest {
  return {
    ...values,
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    description: values.description.trim() || null,
    productIds: [...new Set(values.productIds)],
    categoryIds: [...new Set(values.categoryIds)],
    startOn: new Date(values.startOn).toISOString(),
    endOn: new Date(values.endOn).toISOString(),
  }
}
