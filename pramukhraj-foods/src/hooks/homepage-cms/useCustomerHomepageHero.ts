import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { homepageCmsApi } from '@/services/homepageCmsApi'
import type { CustomerHomepageHeroResponse } from '@/types/homepageCms'

export function useCustomerHomepageHero() {
  const activeRequest = useRef<AbortController | null>(null)
  const [hero, setHero] = useState<CustomerHomepageHeroResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setIsLoading(true)
    setError(null)

    try {
      const response = await homepageCmsApi.getCustomerHero(controller.signal)
      if (!controller.signal.aborted) setHero(response)
    } catch (loadError) {
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

  return { hero, isLoading, error, retry: load }
}
