import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { reviewApi } from '@/services/reviewApi'
import type { CustomerTestimonial } from '@/types/review'

export function useTopTestimonials(enabled: boolean) {
  const [testimonials, setTestimonials] = useState<CustomerTestimonial[]>([])
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
      const result = await reviewApi.getTopTestimonials(controller.signal)
      if (!controller.signal.aborted) {
        setTestimonials(result ?? [])
        setHasLoaded(true)
      }
    } catch (requestError) {
      if (!controller.signal.aborted) setError(getApiErrorMessage(requestError))
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void load()
    return () => activeRequest.current?.abort()
  }, [enabled, load])

  return { testimonials, isLoading, hasLoaded, error, retry: load }
}
