import { ApiPath } from '@/constants/apiPaths'
import { apiDelete, apiGet, apiPostResponse, apiPutResponse } from '@/lib/apiClient'
import type { ComboData } from '@/types/common'
import type {
  CouponDetailsResponse, CouponListPageResponse,
  CreateCouponRequest, UpdateCouponRequest,
} from '@/types/coupon'

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
  getList(pageNumber: number, signal?: AbortSignal) {
    return apiGet<CouponListPageResponse>(`${ApiPath.admin.coupon.getList}?pageNumber=${pageNumber}`, { signal })
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
