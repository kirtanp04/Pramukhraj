import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { adminSalesApi } from '../api/sales.api'
import type {
  AdminSalesReport,
  AdminSalesReportParams,
  SalesDatePreset,
  SalesGranularity,
  SalesStatusFilter,
} from '../types/sales.types'

export function useAdminSalesReport() {
  const [preset, setPreset] = useState<SalesDatePreset>('30d')
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [granularity, setGranularity] = useState<SalesGranularity>('day')
  const [status, setStatus] = useState<SalesStatusFilter>('Confirmed')

  const [report, setReport] = useState<AdminSalesReport | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Compute actual date windows based on preset
  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    switch (preset) {
      case 'today': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        return { startDate: start.toISOString(), endDate: now.toISOString() }
      }
      case 'yesterday': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0)
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
        return { startDate: start.toISOString(), endDate: end.toISOString() }
      }
      case '7d': {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return { startDate: start.toISOString(), endDate: now.toISOString() }
      }
      case '30d': {
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return { startDate: start.toISOString(), endDate: now.toISOString() }
      }
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        return { startDate: start.toISOString(), endDate: now.toISOString() }
      }
      case 'last_month': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        return { startDate: start.toISOString(), endDate: end.toISOString() }
      }
      case 'ytd': {
        const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
        return { startDate: start.toISOString(), endDate: now.toISOString() }
      }
      case 'custom': {
        const start = customStartDate ? new Date(`${customStartDate}T00:00:00Z`).toISOString() : undefined
        const end = customEndDate ? new Date(`${customEndDate}T23:59:59.999Z`).toISOString() : undefined
        return { startDate: start, endDate: end }
      }
      default:
        return {}
    }
  }, [preset, customStartDate, customEndDate])

  const requestParams: AdminSalesReportParams = useMemo(() => ({
    startDate,
    endDate,
    status,
    granularity,
  }), [startDate, endDate, status, granularity])

  const fetchReport = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const params = isManualRefresh ? { ...requestParams, refresh: true } : requestParams
      const res = await adminSalesApi.getReport(params)
      if (res) {
        setReport(res)
        if (isManualRefresh) {
          toast.success('Sales report refreshed with latest data')
        }
      } else {
        setError('Unable to load sales report data')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch sales report'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [requestParams])

  useEffect(() => {
    void fetchReport(false)
  }, [fetchReport])

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true)
    try {
      const { blob, fileName } = await adminSalesApi.exportExcel(requestParams)
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      const dateTag = new Date().toISOString().slice(0, 10)
      a.download = fileName || `SalesReport_Pramukhraj_${preset}_${dateTag}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
      toast.success('Professional Excel report downloaded successfully')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export Excel report'
      toast.error(msg)
    } finally {
      setIsExporting(false)
    }
  }, [requestParams, preset])

  const handleExportCsv = useCallback(async () => {
    setIsExporting(true)
    try {
      const { blob, fileName } = await adminSalesApi.exportCsv(requestParams)
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      const dateTag = new Date().toISOString().slice(0, 10)
      a.download = fileName || `SalesReport_Pramukhraj_${preset}_${dateTag}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
      toast.success('Clean CSV report downloaded successfully')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to export CSV report'
      toast.error(msg)
    } finally {
      setIsExporting(false)
    }
  }, [requestParams, preset])

  const handleClearCache = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await adminSalesApi.clearCache()
      toast.success('Sales cache cleared successfully')
      await fetchReport(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to clear sales cache'
      toast.error(msg)
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchReport])

  return {
    preset,
    setPreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    granularity,
    setGranularity,
    status,
    setStatus,
    report,
    isLoading,
    isRefreshing,
    isExporting,
    error,
    refresh: () => fetchReport(true),
    clearCache: handleClearCache,
    exportExcel: handleExportExcel,
    exportCsv: handleExportCsv,
  }
}
