import { z } from 'zod'

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(1, 'Store name is required.').max(150),
  supportEmail: z.string().trim().min(1, 'Support email is required.').email('Enter a valid support email.').max(254),
  supportPhoneNumber: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, 'Use a valid international number, for example +919876543210.'),
  storeAddress: z.string().trim().min(1, 'Store address is required.').max(1000),
  taxRatePercent: z.number().min(0).max(100),
  freeShippingMinimumAmount: z.number({ error: 'Free shipping minimum is required.' }).min(0).max(10_000_000),
  concurrencyStamp: z.string().nullable().optional(),
})

export const DEFAULT_STORE_SETTINGS = {
  storeName: '', supportEmail: '', supportPhoneNumber: '', storeAddress: '',
  taxRatePercent: 0, freeShippingMinimumAmount: 0, concurrencyStamp: null,
}
