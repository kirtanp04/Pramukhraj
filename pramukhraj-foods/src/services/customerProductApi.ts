import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPost } from '@/lib/apiClient'
import type {
  CustomerHomeProductGroupsResponse,
  CustomerProductImagesDictionary,
} from '@/types/customerProduct'

export const customerProductApi = {
  getHomeGroups(signal?: AbortSignal) {
    return apiGet<CustomerHomeProductGroupsResponse>(
      ApiPath.customer.product.getHomeGroups,
      { signal },
    )
  },

  getImagesByIds(productIds: string[], signal?: AbortSignal) {
    return apiPost<CustomerProductImagesDictionary>(
      ApiPath.customer.product.getImagesByIds,
      { productIds },
      { signal },
    )
  },
}
