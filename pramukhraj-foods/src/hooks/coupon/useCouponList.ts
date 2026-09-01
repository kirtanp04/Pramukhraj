import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { couponApi } from '@/services/couponApi'
import type { CouponListPageResponse, CouponSearchParams } from '@/types/coupon'

export function useCouponList(params: CouponSearchParams) {
  const { applicationScope, discountType, isActive, pageNumber, search, status } = params
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
        const response = await couponApi.getList({ applicationScope, discountType, isActive, pageNumber, search, status }, controller.signal)
        if (!controller.signal.aborted) setData(response)
      } catch (caught: unknown) {
        if (!controller.signal.aborted) setError(getApiErrorMessage(caught))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [applicationScope, discountType, isActive, pageNumber, search, status, refreshKey])

  return { data, error, isLoading, refresh }
}
