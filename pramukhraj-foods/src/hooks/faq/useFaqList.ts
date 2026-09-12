import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { faqApi } from '@/services/faqApi'
import type { FaqListPageResponse } from '@/types/faq'

export function useFaqList(pageNumber: number) {
  const [data, setData] = useState<FaqListPageResponse | null>(null)
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
      const response = await faqApi.getAdminList(pageNumber, controller.signal)
      if (!controller.signal.aborted) setData(response)
    } catch (loadError) {
      if (!controller.signal.aborted) setError(getApiErrorMessage(loadError))
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }, [pageNumber])

  useEffect(() => {
    void load()
    return () => activeRequest.current?.abort()
  }, [load])

  return { data, isLoading, error, retry: load }
}
