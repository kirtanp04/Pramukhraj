import { ApiPath } from '@/constants/apiPaths'
import { apiGet } from '@/lib/apiClient'
import type {
  AdminPaymentDetail,
  AdminPaymentListPage,
  AdminPaymentListQuery,
} from '@/types/adminPayment'

export const adminPaymentApi = {
  getList(params: AdminPaymentListQuery, signal?: AbortSignal) {
    return apiGet<AdminPaymentListPage>(ApiPath.admin.payments.list(params), { signal })
  },

  getById(paymentId: string, signal?: AbortSignal) {
    return apiGet<AdminPaymentDetail>(ApiPath.admin.payments.details(paymentId), { signal })
  },
}

