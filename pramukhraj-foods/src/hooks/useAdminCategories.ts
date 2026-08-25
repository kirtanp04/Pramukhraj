import { useCallback } from 'react'
import { usePaginatedListWithImages } from '@/hooks/usePaginatedListWithImages'
import { productCategoryApi } from '@/services/productCategoryApi'
import type {
  AdminCategoryList,
  CategoryImage,
  CategoryImagesDictionary,
} from '@/types/productCategory'

const CATEGORY_PAGE_SIZE = 10
const getCategoryId = (category: AdminCategoryList) => category.id
const fetchCategoryPage = (page: number, signal: AbortSignal) =>
  productCategoryApi.getAdminCategoryList(page, signal)
const fetchCategoryImages = (
  ids: string[],
  signal: AbortSignal,
): Promise<CategoryImagesDictionary | null> =>
  productCategoryApi.getImagesListByIds(ids, signal)

export function useAdminCategories(page: number) {
  const query = usePaginatedListWithImages<AdminCategoryList, CategoryImage>({
    page,
    pageSize: CATEGORY_PAGE_SIZE,
    getItemId: getCategoryId,
    fetchPage: fetchCategoryPage,
    fetchImages: fetchCategoryImages,
  })
  const { updateItem } = query

  const updateCategoryDescription = useCallback((categoryId: string, description: string) => {
    updateItem(categoryId, (category) => ({ ...category, description }))
  }, [updateItem])

  return {
    categories: query.items,
    categoryImages: query.images,
    pagination: query.pagination,
    isInitialLoading: query.isInitialLoading,
    isPageFetching: query.isPageFetching,
    categoriesError: query.listError,
    imagesLoading: query.imagesLoading,
    imagesError: query.imagesError,
    retry: query.retry,
    updateCategoryDescription,
  }
}
