import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { adminShipmentApi } from '@/services/adminShipmentApi'
import type { AdminShipmentListPage } from '@/types/adminShipment'

const DEFAULT_PAGE_SIZE = 20

interface UseAdminShipmentsOptions {
  page: number
  pageSize?: number
  search?: string
  status?: string
  sortBy?: string
  sortDirection?: string
  onPageChange?: (page: number) => void
}

export function useAdminShipments(options: UseAdminShipmentsOptions) {
  const {
    page,
    pageSize = DEFAULT_PAGE_SIZE,
    search = '',
    status = 'ALL',
    sortBy = 'createdOn',
    sortDirection = 'desc',
    onPageChange,
  } = options

  const [data, setData] = useState<AdminShipmentListPage | null>(null)
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

    adminShipmentApi
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
    shipments: data?.items ?? [],
    totalCount: data?.totalCount ?? 0,
    totalPages: data?.totalPages ?? 1,
    summary: data?.summary ?? {
      total: 0,
      pendingPickup: 0,
      inTransit: 0,
      delivered: 0,
      failedOrRto: 0,
      totalShippingCharges: 0,
    },
    isInitialLoading,
    isFetching,
    error,
    reload,
  }
}

