import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { faqApi } from '@/services/faqApi'
import type { CustomerFaq } from '@/types/faq'

export function useCustomerFaqs(enabled: boolean) {
  const [faqs, setFaqs] = useState<CustomerFaq[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeRequest = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return

    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setIsLoading(true)
    setError(null)

    try {
      const response = await faqApi.getCustomerHome(controller.signal)
      if (!controller.signal.aborted) {
        setFaqs(response ?? [])
        setHasLoaded(true)
      }
    } catch (loadError) {
      if (!controller.signal.aborted) setError(getApiErrorMessage(loadError))
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void load()
    return () => activeRequest.current?.abort()
  }, [enabled, load])

  return { faqs, isLoading, hasLoaded, error, retry: load }
}
