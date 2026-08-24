import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { productCategoryApi } from '@/services/productCategoryApi'
import type { ComboData } from '@/types/common'

interface ProductCategoriesState {
  categories: ComboData[]
  isLoading: boolean
  error: string | null
}

const INITIAL_STATE: ProductCategoriesState = {
  categories: [],
  isLoading: true,
  error: null,
}

export function useProductCategories() {
  const [state, setState] = useState<ProductCategoriesState>(INITIAL_STATE)
  const activeRequest = useRef<AbortController | null>(null)

  const loadCategories = useCallback(async () => {
    activeRequest.current?.abort()

    const controller = new AbortController()
    activeRequest.current = controller
    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const categories = await productCategoryApi.getComboList(controller.signal)
      if (controller.signal.aborted) return

      setState({ categories: categories ?? [], isLoading: false, error: null })
    } catch (error: unknown) {
      if (controller.signal.aborted) return

      setState({
        categories: [],
        isLoading: false,
        error: getApiErrorMessage(error),
      })
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null
      }
    }
  }, [])

  useEffect(() => {
    void loadCategories()
    return () => activeRequest.current?.abort()
  }, [loadCategories])

  return { ...state, retry: loadCategories }
}
