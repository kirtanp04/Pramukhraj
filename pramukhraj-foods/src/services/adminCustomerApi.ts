import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPatchResponse } from '@/lib/apiClient'
import type { AdminCustomerDetails, AdminCustomerListPage, AdminCustomerListQuery } from '@/types/adminCustomer'
import type { AdminCustomerPatchValues } from '@/types/adminCustomerSchema'

export const adminCustomerApi = {
  getList(query: AdminCustomerListQuery, signal?: AbortSignal) {
    return apiGet<AdminCustomerListPage>(ApiPath.admin.customers.list(query), { signal })
  },
  getById(id: string, signal?: AbortSignal) {
    return apiGet<AdminCustomerDetails>(ApiPath.admin.customers.details(id), { signal })
  },
  patch(id: string, payload: AdminCustomerPatchValues, signal?: AbortSignal) {
    return apiPatchResponse<AdminCustomerDetails>(ApiPath.admin.customers.patch(id), payload, { signal })
  },
}
