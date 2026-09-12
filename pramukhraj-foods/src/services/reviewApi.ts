import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPostResponse, apiPutResponse } from '@/lib/apiClient'
import type {
  AdminReviewDetailsResponse,
  AdminReviewListItem,
  CreateAdminReviewRequest,
  UpdateAdminReviewRequest,
  CustomerTestimonial,
} from '@/types/review'

export const reviewApi = {
  getTopTestimonials(signal?: AbortSignal) {
    return apiGet<CustomerTestimonial[]>(ApiPath.customer.review.getTopTestimonials, { signal })
  },
  getAdminList(pageNumber: number, signal?: AbortSignal) {
    return apiGet<AdminReviewListItem[]>(ApiPath.admin.review.getList(pageNumber), { signal })
  },
  getById(id: string, signal?: AbortSignal) {
    return apiGet<AdminReviewDetailsResponse>(ApiPath.admin.review.getById(id), { signal })
  },
  create(payload: CreateAdminReviewRequest, signal?: AbortSignal) {
    return apiPostResponse<string>(ApiPath.admin.review.create, payload, { signal })
  },
  update(id: string, payload: UpdateAdminReviewRequest, signal?: AbortSignal) {
    return apiPutResponse<string>(ApiPath.admin.review.update(id), payload, { signal })
  },
}
