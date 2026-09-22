import { ApiPath } from '@/constants/apiPaths'
import { apiClient, apiGet, apiPost } from '@/lib/apiClient'
import type { AdminLogChunkResponse, AdminLogFileInfo, AdminLogQueryParams, ClearLogsPayload } from '../types/logs.types'

export const adminLogsApi = {
  getChunk(params?: AdminLogQueryParams, signal?: AbortSignal): Promise<AdminLogChunkResponse | null> {
    return apiGet<AdminLogChunkResponse>(ApiPath.admin.logs.getChunk, {
      signal,
      params,
    })
  },

  getFiles(signal?: AbortSignal): Promise<AdminLogFileInfo[] | null> {
    return apiGet<AdminLogFileInfo[]>(ApiPath.admin.logs.getFiles, { signal })
  },

  clear(payload: ClearLogsPayload, signal?: AbortSignal): Promise<boolean | null> {
    return apiPost<boolean>(ApiPath.admin.logs.clear, payload, { signal })
  },

  getDownloadUrl(date?: string): string {
    const relativeUrl = ApiPath.admin.logs.download(date)
    return apiClient.getUri({ url: relativeUrl })
  },
}

