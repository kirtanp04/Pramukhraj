import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { adminPaymentApi } from '@/services/adminPaymentApi'
import type { AdminPaymentListPage } from '@/types/adminPayment'

const DEFAULT_PAGE_SIZE = 20

interface UseAdminPaymentsOptions {
  page: number
  pageSize?: number
  search?: string
  status?: string
  sortBy?: string
  sortDirection?: string
  onPageChange?: (page: number) => void
}

export function useAdminPayments(options: UseAdminPaymentsOptions) {
  const {
    page,
    pageSize = DEFAULT_PAGE_SIZE,
    search = '',
    status = 'ALL',
    sortBy = 'createdOn',
    sortDirection = 'desc',
    onPageChange,
  } = options

  const [data, setData] = useState<AdminPaymentListPage | null>(null)
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

    adminPaymentApi
      .getList(
        {
          pageNumber: page,
          pageSize,
          search: search.trim() || undefined,
          status: status === 'ALL' ? undefined : status,
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

    return () => {
      controller.abort()
    }
  }, [
    page,
    pageSize,
    search,
    status,
    sortBy,
    sortDirection,
    reloadTrigger,
    onPageChange,
  ])

  return {
    payments: data?.items ?? [],
    totalCount: data?.totalCount ?? 0,
    totalPages: data?.totalPages ?? 1,
    summary: data?.summary ?? {
      total: 0,
      paid: 0,
      pending: 0,
      failed: 0,
      expired: 0,
      totalPaidAmount: 0,
    },
    isInitialLoading,
    isFetching,
    error,
    reload,
  }
}

