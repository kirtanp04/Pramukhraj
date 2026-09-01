import { ApiPath } from '@/constants/apiPaths'
import { apiDelete, apiGet, apiPostResponse, apiPutResponse } from '@/lib/apiClient'
import type { ComboData } from '@/types/common'
import type {
  CouponDetailsResponse, CouponListPageResponse, CouponSearchParams,
  CreateCouponRequest, UpdateCouponRequest,
} from '@/types/coupon'

function listUrl(params: CouponSearchParams) {
  const query = new URLSearchParams({ PageNumber: String(params.pageNumber) })
  if (params.search) query.set('Search', params.search)
  if (params.isActive !== undefined) query.set('IsActive', String(params.isActive))
  if (params.status) query.set('Status', params.status)
  if (params.discountType) query.set('DiscountType', params.discountType)
  if (params.applicationScope) query.set('ApplicationScope', params.applicationScope)
  return `${ApiPath.admin.coupon.getList}?${query.toString()}`
}

export const couponApi = {
  create(payload: CreateCouponRequest) {
    return apiPostResponse<string>(ApiPath.admin.coupon.create, payload)
  },
  update(id: string, payload: UpdateCouponRequest, signal?: AbortSignal) {
    return apiPutResponse<string>(ApiPath.admin.coupon.update(id), payload, { signal })
  },
  getById(id: string, signal?: AbortSignal) {
    return apiGet<CouponDetailsResponse>(ApiPath.admin.coupon.getById(id), { signal })
  },
  getList(params: CouponSearchParams, signal?: AbortSignal) {
    return apiGet<CouponListPageResponse>(listUrl(params), { signal })
  },
  archive(id: string, signal?: AbortSignal) {
    return apiDelete<string>(ApiPath.admin.coupon.archive(id), { signal })
  },
  getProductComboList(signal?: AbortSignal) {
    return apiGet<ComboData[]>(ApiPath.admin.product.getComboList, { signal })
  },
  getCategoryComboList(signal?: AbortSignal) {
    return apiGet<ComboData[]>(ApiPath.admin.productCategory.getComboList, { signal })
  },
}
