
import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPostResponse } from '@/lib/apiClient'
import type { ComboData } from '@/types/common'
import type { AddProductCategoryRequest } from '@/types/productCategorySchema'

export const productCategoryApi = {
  add(payload: AddProductCategoryRequest) {
    return apiPostResponse<string>(ApiPath.admin.productCategory.add, payload)
  },
  getComboList(signal?: AbortSignal) {
    return apiGet<ComboData[]>(ApiPath.admin.productCategory.getComboList, { signal })
  },
}
