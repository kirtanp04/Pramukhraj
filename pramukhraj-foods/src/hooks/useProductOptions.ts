import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { productApi } from '@/services/productApi'
import type { ComboData } from '@/types/common'

export function useProductOptions() {
  const [products, setProducts] = useState<ComboData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const activeRequest = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setIsLoading(true)
    setError(null)
    try {
      const result = await productApi.getComboList(controller.signal)
      if (!controller.signal.aborted) setProducts(result ?? [])
    } catch (loadError: unknown) {
      if (!controller.signal.aborted) setError(getApiErrorMessage(loadError))
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }, [])

  useEffect(() => {
    void load()
    return () => activeRequest.current?.abort()
  }, [load])

  return { products, isLoading, error, retry: load }
}
