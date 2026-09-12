import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { cacheMetricsApi } from '@/services/cacheMetricsApi'
import type { CacheMetrics } from '@/types/cacheMetrics'
import type { CacheInvalidationResult } from '@/types/cacheMetrics'

const REFRESH_INTERVAL_MS = 30_000

export function useCacheMetrics() {
  const activeRequest = useRef<AbortController | null>(null)
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutationTarget, setMutationTarget] = useState<string | null>(null)

  const load = useCallback(async (background = false) => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    if (background) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const response = await cacheMetricsApi.get(controller.signal)
      if (!controller.signal.aborted && response) {
        setMetrics(response)
        setError(null)
      }
    } catch (requestError) {
      if (!controller.signal.aborted) setError(getApiErrorMessage(requestError))
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => void load(true), REFRESH_INTERVAL_MS)
    return () => {
      window.clearInterval(interval)
      activeRequest.current?.abort()
    }
  }, [load])

  const invalidate = useCallback(async (
    target: string,
    operation: () => Promise<CacheInvalidationResult | null>,
  ) => {
    setMutationTarget(target)
    try {
      const result = await operation()
      await load(true)
      return result
    } finally {
      setMutationTarget(null)
    }
  }, [load])

  return {
    metrics,
    isLoading,
    isRefreshing,
    error,
    mutationTarget,
    refresh: () => load(metrics !== null),
    clearAll: () => invalidate('all', () => cacheMetricsApi.clearAll()),
    clearKey: (key: string) => invalidate(`key:${key}`, () => cacheMetricsApi.clearKey(key)),
    clearModule: (module: string) => invalidate(`module:${module}`, () => cacheMetricsApi.clearModule(module)),
  }
}
