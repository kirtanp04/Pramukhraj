import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { customerCategoryApi } from '@/services/customerCategoryApi'
import type { CustomerCategory } from '@/types/customerCategory'

interface CustomerCategoryState {
  categories: CustomerCategory[]
  isLoading: boolean
  isLoadingImages: boolean
  error: string | null
  imagesError: string | null
  hasLoadedImages: boolean
}

const initialState: CustomerCategoryState = {
  categories: [],
  isLoading: true,
  isLoadingImages: false,
  error: null,
  imagesError: null,
  hasLoadedImages: false,
}

export function useCustomerCategoriesQuery() {
  const [state, setState] = useState(initialState)
  const activeRequest = useRef<AbortController | null>(null)
  const activeImagesRequest = useRef<AbortController | null>(null)

  const loadCategories = useCallback(async () => {
    activeRequest.current?.abort()
    activeImagesRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const list = (await customerCategoryApi.getList(controller.signal)) ?? []
      if (controller.signal.aborted) return

      const categories = list.map((category) => ({
        id: category.categoryId,
        name: category.categoryName,
        slug: category.slug,
        image: '',
        productCount: category.productCount,
      }))

      setState({
        categories,
        isLoading: false,
        isLoadingImages: false,
        error: null,
        imagesError: null,
        hasLoadedImages: false,
      })
    } catch (error: unknown) {
      if (controller.signal.aborted) return
      setState({
        categories: [],
        isLoading: false,
        isLoadingImages: false,
        error: getApiErrorMessage(error),
        imagesError: null,
        hasLoadedImages: false,
      })
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }, [])

  const loadImages = useCallback(async () => {
    if (
      state.categories.length === 0 ||
      state.isLoadingImages ||
      state.hasLoadedImages ||
      state.imagesError !== null
    ) return

    activeImagesRequest.current?.abort()
    const controller = new AbortController()
    activeImagesRequest.current = controller
    setState((current) => ({ ...current, isLoadingImages: true, imagesError: null }))

    try {
      const images = await customerCategoryApi.getImagesByIds(
        state.categories.map((category) => category.id),
        controller.signal,
      )
      if (controller.signal.aborted) return

      const normalizedImages = Object.fromEntries(
        Object.entries(images ?? {}).map(([id, image]) => [id.toLowerCase(), image]),
      )
      setState((current) => ({
        ...current,
        categories: current.categories.map((category) => ({
          ...category,
          image: normalizedImages[category.id.toLowerCase()]?.imageurl ?? '',
        })),
        isLoadingImages: false,
        hasLoadedImages: true,
      }))
    } catch (error: unknown) {
      if (controller.signal.aborted) return
      setState((current) => ({
        ...current,
        isLoadingImages: false,
        imagesError: getApiErrorMessage(error),
      }))
    } finally {
      if (activeImagesRequest.current === controller) activeImagesRequest.current = null
    }
  }, [state.categories, state.hasLoadedImages, state.imagesError, state.isLoadingImages])

  useEffect(() => {
    void loadCategories()
    return () => {
      activeRequest.current?.abort()
      activeImagesRequest.current?.abort()
    }
  }, [loadCategories])

  return { ...state, retry: loadCategories, loadImages }
}
