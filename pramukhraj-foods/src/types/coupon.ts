import type { ComboData } from '@/types/common'

export type CouponDiscountType = 'Percentage' | 'FlatAmount' | 'FreeShipping'
export type CouponApplicationScope = 'AllProducts' | 'SpecificProducts' | 'SpecificCategories'
export type CouponStatus = 'Scheduled' | 'Active' | 'Expired' | 'Inactive' | 'UsageLimitReached' | 'Archived'

export interface CouponWriteRequest {
  code: string
  name: string
  description: string | null
  discountType: CouponDiscountType
  discountValue: number
  minimumOrderAmount: number
  maximumDiscountAmount: number | null
  applicationScope: CouponApplicationScope
  productIds: string[]
  categoryIds: string[]
  totalUsageLimit: number | null
  perCustomerUsageLimit: number | null
  isFirstOrderOnly: boolean
  canCombineWithOtherDiscounts: boolean
  startOn: string
  endOn: string
  isActive: boolean
}

export type CreateCouponRequest = CouponWriteRequest
export type UpdateCouponRequest = CouponWriteRequest

export interface CouponDetailsResponse extends CouponWriteRequest {
  id: string
  createdOn: string
  updatedOn: string
  redeemedUsageCount: number
  reservedUsageCount: number
}

export interface CouponListItemResponse {
  id: string
  code: string
  name: string
  discountType: CouponDiscountType
  discountValue: number
  displayFriendlyDiscount: string
  applicationScope: CouponApplicationScope
  minimumOrderAmount: number
  maximumDiscountAmount: number | null
  totalUsageLimit: number | null
  perCustomerUsageLimit: number | null
  redeemedUsageCount: number
  startOn: string
  endOn: string
  isActive: boolean
  isDeleted: boolean
  computedStatus: CouponStatus
  scopeItemCount: number
}

export interface CouponListPageResponse {
  items: CouponListItemResponse[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface CouponSearchParams {
  pageNumber: number
  search?: string
  isActive?: boolean
  status?: CouponStatus
  discountType?: CouponDiscountType
  applicationScope?: CouponApplicationScope
}

export type { ComboData }
