import type { z } from 'zod'
import type { storeSettingsSchema } from './storeSettingsSchema'

export interface StoreSettings {
  supportEmail: string
  supportPhoneNumber: string
  taxRatePercent: number | null
  paymentProcessingFee: number | null
  paymentServiceTaxRatePercent?: number | null
  storeAddress: string
  storeName: string
  freeShippingMinimumAmount: number
  returnWindowDays: number
  updatedOn: string | null
  concurrencyStamp: string | null
  storeAddressLine1?: string | null
  storeAddressLine2?: string | null
  storeCity?: string | null
  storeState?: string | null
  storePostalCode?: string | null
  storeCountry?: string | null
  logoUrl?: string | null
}

export type StoreSettingsFormValues = z.infer<typeof storeSettingsSchema>
