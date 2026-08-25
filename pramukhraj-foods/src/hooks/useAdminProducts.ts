import { usePaginatedListWithImages } from '@/hooks/usePaginatedListWithImages'
import { productApi } from '@/services/productApi'
import type {
  AdminProductList,
  ProductImage,
  ProductImagesDictionary,
} from '@/types/productSchema'

const PRODUCT_PAGE_SIZE = 10
const getProductId = (product: AdminProductList) => product.id
const fetchProductPage = (page: number, signal: AbortSignal) =>
  productApi.getAdminProductList(page, signal)
const fetchProductImages = (
  ids: string[],
  signal: AbortSignal,
): Promise<ProductImagesDictionary | null> =>
  productApi.getImagesListByIds(ids, signal)

export function useAdminProducts(page: number) {
  return usePaginatedListWithImages<AdminProductList, ProductImage>({
    page,
    pageSize: PRODUCT_PAGE_SIZE,
    getItemId: getProductId,
    fetchPage: fetchProductPage,
    fetchImages: fetchProductImages,
  })
}
