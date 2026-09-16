import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'

export function useMonitoringSnapshot<T>(
  loader: (signal?: AbortSignal) => Promise<T | null>,
  intervalMilliseconds = 15_000,
) {
  const [metrics, setMetrics] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const refresh = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsRefreshing(true)
    try {
      const result = await loader(controller.signal)
      if (!result) throw new Error('The monitoring endpoint returned no data.')
      setMetrics(result)
      setError(null)
    } catch (requestError) {
      if (!controller.signal.aborted) setError(getApiErrorMessage(requestError))
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [loader])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), intervalMilliseconds)
    return () => {
      window.clearInterval(timer)
      controllerRef.current?.abort()
    }
  }, [intervalMilliseconds, refresh])

  return { metrics, isLoading, isRefreshing, error, refresh }
}
