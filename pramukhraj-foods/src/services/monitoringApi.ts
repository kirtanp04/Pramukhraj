import { ApiPath } from '@/constants/apiPaths'
import { apiGet } from '@/lib/apiClient'
import type { BackgroundMetrics, ServerMetrics } from '@/types/monitoring'

export const monitoringApi = {
  getBackground(signal?: AbortSignal) {
    return apiGet<BackgroundMetrics>(ApiPath.admin.monitoring.background, { signal })
  },
  getServer(signal?: AbortSignal) {
    return apiGet<ServerMetrics>(ApiPath.admin.monitoring.server, { signal })
  },
}
