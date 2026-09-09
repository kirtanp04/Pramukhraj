import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPost } from '@/lib/apiClient'
import type { CategoryImagesDictionary, GetCategoryImagesRequestPayload } from '@/types/productCategory'
import type { CustomerCategoryListItem } from '@/types/customerCategory'

export const customerCategoryApi = {
  getList(signal?: AbortSignal) {
    return apiGet<CustomerCategoryListItem[]>(
      ApiPath.customer.productCategory.getList,
      { signal },
    )
  },

  getImagesByIds(categoryIds: string[], signal?: AbortSignal) {
    const payload: GetCategoryImagesRequestPayload = { categoryIds }
    return apiPost<CategoryImagesDictionary>(
      ApiPath.customer.productCategory.getImagesListByIds,
      payload,
      { signal },
    )
  },
}
