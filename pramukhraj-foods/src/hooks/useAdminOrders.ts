import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { adminOrderApi } from '@/services/adminOrderApi'
import type { AdminOrderListPage } from '@/types/adminOrder'

const DEFAULT_PAGE_SIZE = 20

interface UseAdminOrdersOptions {
  page: number
  pageSize?: number
  search?: string
  status?: string
  paymentStatus?: string
  shipmentStatus?: string
  sortBy?: string
  sortDirection?: string
  onPageChange?: (page: number) => void
}

export function useAdminOrders(options: UseAdminOrdersOptions) {
  const {
    page,
    pageSize = DEFAULT_PAGE_SIZE,
    search = '',
    status = 'ALL',
    paymentStatus = 'ALL',
    shipmentStatus = 'ALL',
    sortBy = 'createdOn',
    sortDirection = 'desc',
    onPageChange,
  } = options

  const [data, setData] = useState<AdminOrderListPage | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const reload = useCallback(() => {
    setReloadTrigger((prev) => prev + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    setIsFetching(true)

    adminOrderApi
      .getList(
        {
          pageNumber: page,
          pageSize,
          search: search.trim() || undefined,
          status: status === 'ALL' ? undefined : status,
          paymentStatus: paymentStatus === 'ALL' ? undefined : paymentStatus,
          shipmentStatus: shipmentStatus === 'ALL' ? undefined : shipmentStatus,
          sortBy,
          sortDirection,
        },
        controller.signal,
      )
      .then((result) => {
        if (!result || controller.signal.aborted) return
        setData(result)
        if (result.totalPages > 0 && page > result.totalPages && onPageChange) {
          onPageChange(result.totalPages)
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(getApiErrorMessage(err))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsInitialLoading(false)
          setIsFetching(false)
        }
      })

    return () => controller.abort()
  }, [page, pageSize, search, status, paymentStatus, shipmentStatus, sortBy, sortDirection, reloadTrigger, onPageChange])

  return {
    orders: data?.items ?? [],
    summary: data?.summary ?? null,
    totalCount: data?.totalCount ?? 0,
    totalPages: data?.totalPages ?? 1,
    pagination: {
      page,
      pageSize,
      totalCount: data?.totalCount ?? 0,
      totalPages: data?.totalPages ?? 1,
      hasPreviousPage: page > 1,
      hasNextPage: page < (data?.totalPages ?? 1),
    },
    isInitialLoading,
    isFetching,
    error,
    reload,
  }
}
