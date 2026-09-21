import { ApiPath } from '@/constants/apiPaths'
import { apiGet } from '@/lib/apiClient'
import type {
  AdminOrderDetail,
  AdminOrderListPage,
  AdminOrderListParams,
} from '@/types/adminOrder'

export const adminOrderApi = {
  getList(params: AdminOrderListParams, signal?: AbortSignal) {
    return apiGet<AdminOrderListPage>(ApiPath.admin.orders.list(params), { signal })
  },

  getById(orderId: string, signal?: AbortSignal) {
    return apiGet<AdminOrderDetail>(ApiPath.admin.orders.details(orderId), { signal })
  },
}

