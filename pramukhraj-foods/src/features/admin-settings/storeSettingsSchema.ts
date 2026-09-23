import { z } from 'zod'

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(1, 'Store name is required.').max(150),
  supportEmail: z.string().trim().min(1, 'Support email is required.').email('Enter a valid support email.').max(254),
  supportPhoneNumber: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, 'Use a valid international number, for example +919876543210.'),
  storeAddress: z.string().trim().min(1, 'Store address is required.').max(1000),
  taxRatePercent: z.number().min(0).max(100),
  paymentServiceTaxRatePercent: z.number().min(0).max(100),
  freeShippingMinimumAmount: z.number({ error: 'Free shipping minimum is required.' }).min(0).max(10_000_000),
  returnWindowDays: z
    .number({ error: 'Return window is required.' })
    .int('Return window must be a whole number of days.')
    .min(0, 'Return window cannot be negative.')
    .max(365, 'Return window cannot exceed 365 days.'),
  concurrencyStamp: z.string().nullable().optional(),
})

export const DEFAULT_STORE_SETTINGS = {
  storeName: '', supportEmail: '', supportPhoneNumber: '', storeAddress: '',
  taxRatePercent: 0, paymentServiceTaxRatePercent: 0, freeShippingMinimumAmount: 0,
  returnWindowDays: 0, concurrencyStamp: null,
}
