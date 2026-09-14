import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPost } from '@/lib/apiClient'
import type {
  CustomerHomeProductGroupsResponse,
  CustomerProductListRequest,
  CustomerProductListResponse,
  CustomerProductImagesDictionary,
} from '@/types/customerProduct'

function getImagesByIds(productIds: string[], signal?: AbortSignal) {
  return apiPost<CustomerProductImagesDictionary>(
    ApiPath.customer.product.getImagesByIds,
    { productIds },
    { signal },
  )
}

async function getList(filters: CustomerProductListRequest, signal?: AbortSignal) {
  const response = await apiPost<CustomerProductListResponse>(
    ApiPath.customer.product.getList,
    filters,
    { signal },
  )

  if (!response || !Array.isArray(response.products) || response.products.length === 0) {
    return response
  }

  try {
    const images = await getImagesByIds(
      response.products.map((product) => product.productId),
      signal,
    )
    const normalizedImages = new Map(
      Object.entries(images ?? {}).map(([id, image]) => [id.toLowerCase(), image.imageurl]),
    )

    return {
      ...response,
      products: response.products.map((product) => ({
        ...product,
        imageUrl: normalizedImages.get(product.productId.toLowerCase()) ?? product.imageUrl,
      })),
    }
  } catch (error: unknown) {
    if (signal?.aborted) throw error
    // Product data remains useful if an image request temporarily fails.
    // Visible cards retry through the shared lazy image loader.
    return response
  }
}

export const customerProductApi = {
  getList,

  getHomeGroups(signal?: AbortSignal) {
    return apiGet<CustomerHomeProductGroupsResponse>(
      ApiPath.customer.product.getHomeGroups,
      { signal },
    )
  },

  getImagesByIds,
}
