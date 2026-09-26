import { z } from 'zod'

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(1, 'Store name is required.').max(150),
  supportEmail: z.string().trim().min(1, 'Support email is required.').email('Enter a valid support email.').max(254),
  supportPhoneNumber: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, 'Use a valid international number, for example +919876543210.'),
  storeAddressLine1: z.string().trim().min(1, 'Address line 1 (street/building/plot) is required.').max(250),
  storeAddressLine2: z.string().trim().max(250).optional().nullable(),
  storeCity: z.string().trim().min(1, 'City is required.').max(100),
  storeState: z.string().trim().min(1, 'State is required.').max(100),
  storePostalCode: z.string().trim().regex(/^\d{6}$/, 'PIN code must be a valid 6-digit Indian postal code.'),
  storeCountry: z.string().trim().min(1, 'Country is required.').max(100),
  storeAddress: z.string().trim().max(1000).optional().nullable(),
  taxRatePercent: z.number().min(0).max(100),
  paymentProcessingFee: z
    .number({ error: 'Payment processing fee is required.' })
    .min(0, 'Payment processing fee cannot be negative.')
    .max(10_000, 'Payment processing fee cannot exceed ₹10,000.'),
  paymentServiceTaxRatePercent: z.number().min(0).max(100).optional().nullable(),
  freeShippingMinimumAmount: z.number({ error: 'Free shipping minimum is required.' }).min(0).max(10_000_000),
  returnWindowDays: z
    .number({ error: 'Return window is required.' })
    .int('Return window must be a whole number of days.')
    .min(0, 'Return window cannot be negative.')
    .max(365, 'Return window cannot exceed 365 days.'),
  logoUrl: z.string().trim().max(2_000_000).optional().nullable(),
  concurrencyStamp: z.string().nullable().optional(),
})

export const DEFAULT_STORE_SETTINGS = {
  storeName: '', supportEmail: '', supportPhoneNumber: '', storeAddress: '',
  storeAddressLine1: '', storeAddressLine2: '', storeCity: '', storeState: '',
  storePostalCode: '', storeCountry: 'India', logoUrl: '',
  taxRatePercent: 0, paymentProcessingFee: 0, paymentServiceTaxRatePercent: 0, freeShippingMinimumAmount: 0,
  returnWindowDays: 0, concurrencyStamp: null,
}
