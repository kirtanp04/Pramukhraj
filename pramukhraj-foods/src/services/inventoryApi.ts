import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPatchResponse, apiPost } from '@/lib/apiClient'
import type {
  AdminInventoryItem,
  GetInventoryProductImagesRequest,
  InventoryProductImagesDictionary,
  UpdateVariantInventoryRequest,
  UpdateVariantInventoryResponse,
} from '@/types/inventory'

export const inventoryApi = {
  getAdminInventoryList(pageNumber: number, signal?: AbortSignal) {
    return apiGet<AdminInventoryItem[]>(
      ApiPath.admin.inventory.getAdminList(pageNumber),
      { signal },
    )
  },

  getProductImagesByIds(productIds: string[], signal?: AbortSignal) {
    const payload: GetInventoryProductImagesRequest = { productIds }
    return apiPost<InventoryProductImagesDictionary>(
      ApiPath.admin.inventory.getImagesListByProductIds,
      payload,
      { signal },
    )
  },

  updateVariant(payload: UpdateVariantInventoryRequest, signal?: AbortSignal) {
    return apiPatchResponse<UpdateVariantInventoryResponse>(
      ApiPath.admin.inventory.updateVariant,
      payload,
      { signal },
    )
  },
}
