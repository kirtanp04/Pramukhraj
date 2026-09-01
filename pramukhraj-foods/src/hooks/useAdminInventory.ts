import { useCallback } from 'react'
import { usePaginatedListWithImages } from '@/hooks/usePaginatedListWithImages'
import { inventoryApi } from '@/services/inventoryApi'
import type {
  AdminInventoryItem,
  InventoryProductImage,
  InventoryProductImagesDictionary,
  UpdateVariantInventoryRequest,
} from '@/types/inventory'

const INVENTORY_PAGE_SIZE = 20
const getVariantId = (item: AdminInventoryItem) => item.id
const getProductId = (item: AdminInventoryItem) => item.productId
const fetchInventoryPage = (page: number, signal: AbortSignal) =>
  inventoryApi.getAdminInventoryList(page, signal)
const fetchProductImages = (
  productIds: string[],
  signal: AbortSignal,
): Promise<InventoryProductImagesDictionary | null> =>
  inventoryApi.getProductImagesByIds(productIds, signal)

export function useAdminInventory(page: number) {
  const query = usePaginatedListWithImages<AdminInventoryItem, InventoryProductImage>({
    page,
    pageSize: INVENTORY_PAGE_SIZE,
    getItemId: getVariantId,
    getImageId: getProductId,
    fetchPage: fetchInventoryPage,
    fetchImages: fetchProductImages,
  })
  const { updateItem } = query

  const updateVariantInventory = useCallback(async (
    payload: UpdateVariantInventoryRequest,
    signal?: AbortSignal,
  ) => {
    const response = await inventoryApi.updateVariant(payload, signal)
    const updated = response.data

    if (updated) {
      updateItem(updated.variantId, item => ({
        ...item,
        stock: updated.stock,
        isVariantActive: updated.isActive,
      }))
    }

    return response
  }, [updateItem])

  return {
    inventory: query.items,
    productImages: query.images,
    pagination: query.pagination,
    isInitialLoading: query.isInitialLoading,
    isPageFetching: query.isPageFetching,
    inventoryError: query.listError,
    imagesLoading: query.imagesLoading,
    imagesError: query.imagesError,
    retry: query.retry,
    updateVariantInventory,
  }
}
