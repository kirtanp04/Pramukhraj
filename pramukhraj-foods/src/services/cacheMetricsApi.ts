import { ApiPath } from '@/constants/apiPaths'
import { apiDelete, apiGet } from '@/lib/apiClient'
import type { CacheInvalidationResult, CacheMetrics } from '@/types/cacheMetrics'

export const cacheMetricsApi = {
  get(signal?: AbortSignal) {
    return apiGet<CacheMetrics>(ApiPath.admin.cacheMetrics.get, {
      signal,
      headers: { 'Cache-Control': 'no-cache' },
      params: { timestamp: Date.now() },
    })
  },
  clearAll(signal?: AbortSignal) {
    return apiDelete<CacheInvalidationResult>(ApiPath.admin.cacheMetrics.clearAll, { signal })
  },
  clearKey(key: string, signal?: AbortSignal) {
    return apiDelete<CacheInvalidationResult>(ApiPath.admin.cacheMetrics.clearKey, {
      signal,
      params: { key },
    })
  },
  clearModule(module: string, signal?: AbortSignal) {
    return apiDelete<CacheInvalidationResult>(ApiPath.admin.cacheMetrics.clearModule, {
      signal,
      params: { module },
    })
  },
}
