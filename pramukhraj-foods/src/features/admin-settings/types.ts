export interface StoreSettings {
  supportEmail: string
  supportPhoneNumber: string
  taxRatePercent: number | null
  storeAddress: string
  storeName: string
  freeShippingMinimumAmount: number
  updatedOn: string | null
  concurrencyStamp: string | null
}

export interface StoreSettingsFormValues {
  supportEmail: string
  supportPhoneNumber: string
  taxRatePercent: number
  storeAddress: string
  storeName: string
  freeShippingMinimumAmount: number
  concurrencyStamp?: string | null
}
