import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPostResponse, apiPutResponse } from '@/lib/apiClient'
import type {
  CustomerFaq,
  FaqDetailsResponse,
  FaqListPageResponse,
  FaqWriteRequest,
} from '@/types/faq'

export const faqApi = {
  getAdminList(pageNumber: number, signal?: AbortSignal) {
    return apiGet<FaqListPageResponse>(ApiPath.admin.faq.getList(pageNumber), { signal })
  },
  getById(id: string, signal?: AbortSignal) {
    return apiGet<FaqDetailsResponse>(ApiPath.admin.faq.getById(id), { signal })
  },
  create(payload: FaqWriteRequest, signal?: AbortSignal) {
    return apiPostResponse<string>(ApiPath.admin.faq.create, payload, { signal })
  },
  update(id: string, payload: FaqWriteRequest, signal?: AbortSignal) {
    return apiPutResponse<string>(ApiPath.admin.faq.update(id), payload, { signal })
  },
  getCustomerHome(signal?: AbortSignal) {
    return apiGet<CustomerFaq[]>(ApiPath.customer.faq.getHome, { signal })
  },
}
