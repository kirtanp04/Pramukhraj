import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { couponApi } from '@/services/couponApi'
import type { CouponListPageResponse } from '@/types/coupon'

export function useCouponList(pageNumber: number) {
  const [data, setData] = useState<CouponListPageResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey(key => key + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await couponApi.getList(pageNumber, controller.signal)
        if (!controller.signal.aborted) setData(response)
      } catch (caught: unknown) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(caught))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [pageNumber, refreshKey])

  return { data, error, isLoading, refresh }
}
