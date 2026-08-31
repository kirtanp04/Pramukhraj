import { ApiPath } from '@/constants/apiPaths'
import { apiGet } from '@/lib/apiClient'
import type { AdminActionListItem } from '@/types/adminAction'

export const adminActionApi = {
  getList(pageNumber: number, signal?: AbortSignal) {
    return apiGet<AdminActionListItem[]>(
      ApiPath.admin.adminAction.getList(pageNumber),
      { signal },
    )
  },
}
