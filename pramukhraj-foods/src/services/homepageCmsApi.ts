import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPostResponse } from '@/lib/apiClient'
import type {
  AdminHomepageCmsResponse,
  CustomerHomepageHeroResponse,
  HomepageCmsWriteRequest,
} from '@/types/homepageCms'

export const homepageCmsApi = {
  getAdmin(signal?: AbortSignal) {
    return apiGet<AdminHomepageCmsResponse>(ApiPath.admin.homepageCms.get, { signal })
  },
  replace(payload: HomepageCmsWriteRequest, signal?: AbortSignal) {
    return apiPostResponse<number>(ApiPath.admin.homepageCms.replace, payload, { signal })
  },
  getCustomerHero(signal?: AbortSignal) {
    return apiGet<CustomerHomepageHeroResponse>(ApiPath.customer.homepageCms.getHero, { signal })
  },
}
