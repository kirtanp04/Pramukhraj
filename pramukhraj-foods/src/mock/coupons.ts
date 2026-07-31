export interface Coupon {
  id: string
  code: string
  type: 'Percentage' | 'Flat'
  value: number
  minOrder: number
  expiresOn: string
  status: 'Active' | 'Expired' | 'Scheduled'
  usageCount: number
  usageLimit: number
}

export const coupons: Coupon[] = [
  { id: 'cp-1', code: 'WELCOME10', type: 'Percentage', value: 10, minOrder: 299, expiresOn: '2026-12-31', status: 'Active', usageCount: 1204, usageLimit: 5000 },
  { id: 'cp-2', code: 'FESTIVE20', type: 'Percentage', value: 20, minOrder: 999, expiresOn: '2026-11-15', status: 'Active', usageCount: 342, usageLimit: 2000 },
  { id: 'cp-3', code: 'FLAT100', type: 'Flat', value: 100, minOrder: 799, expiresOn: '2026-08-31', status: 'Active', usageCount: 890, usageLimit: 1500 },
  { id: 'cp-4', code: 'SUMMER15', type: 'Percentage', value: 15, minOrder: 499, expiresOn: '2026-06-30', status: 'Expired', usageCount: 2210, usageLimit: 2500 },
  { id: 'cp-5', code: 'DIWALI25', type: 'Percentage', value: 25, minOrder: 1499, expiresOn: '2026-10-25', status: 'Scheduled', usageCount: 0, usageLimit: 3000 },
]
