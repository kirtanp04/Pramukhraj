import { ApiPath } from '@/constants/apiPaths'
import { apiGet } from '@/lib/apiClient'
import type {
  AdminShipmentDetail,
  AdminShipmentListPage,
  AdminShipmentListQuery,
} from '@/types/adminShipment'

export const adminShipmentApi = {
  getList(params: AdminShipmentListQuery, signal?: AbortSignal) {
    return apiGet<AdminShipmentListPage>(ApiPath.admin.shipments.list(params), { signal })
  },

  getById(shipmentId: string, signal?: AbortSignal) {
    return apiGet<AdminShipmentDetail>(ApiPath.admin.shipments.details(shipmentId), { signal })
  },
}

