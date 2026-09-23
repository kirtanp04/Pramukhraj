import { ApiPath } from '@/constants/apiPaths'
import { apiClient, apiGet } from '@/lib/apiClient'
import type { AdminSalesReport, AdminSalesReportParams } from '../types/sales.types'

export const adminSalesApi = {
  getReport(params?: AdminSalesReportParams, signal?: AbortSignal): Promise<AdminSalesReport | null> {
    return apiGet<AdminSalesReport>(ApiPath.admin.sales.report(params), {
      signal,
    })
  },

  async exportExcel(params?: AdminSalesReportParams, signal?: AbortSignal): Promise<{ blob: Blob; fileName?: string }> {
    const url = ApiPath.admin.sales.export({ ...params, format: 'excel' })
    const response = await apiClient.get<Blob>(url, {
      responseType: 'blob',
      signal,
    })
    const disposition = response.headers['content-disposition'] as string | undefined
    let fileName: string | undefined
    if (disposition) {
      const match = disposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i)
      if (match?.[1]) fileName = decodeURIComponent(match[1])
    }
    return { blob: response.data, fileName }
  },

  async exportCsv(params?: AdminSalesReportParams, signal?: AbortSignal): Promise<{ blob: Blob; fileName?: string }> {
    const url = ApiPath.admin.sales.export({ ...params, format: 'csv' })
    const response = await apiClient.get<Blob>(url, {
      responseType: 'blob',
      signal,
    })
    const disposition = response.headers['content-disposition'] as string | undefined
    let fileName: string | undefined
    if (disposition) {
      const match = disposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i)
      if (match?.[1]) fileName = decodeURIComponent(match[1])
    }
    return { blob: response.data, fileName }
  },

  getExportUrl(params?: AdminSalesReportParams, format: 'excel' | 'csv' = 'excel'): string {
    const relativeUrl = ApiPath.admin.sales.export({ ...params, format })
    return apiClient.getUri({ url: relativeUrl })
  },

  async clearCache(signal?: AbortSignal): Promise<boolean> {
    await apiClient.post(ApiPath.admin.sales.clearCache, {}, { signal })
    return true
  },
}

