import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiClient'
import { couponApi } from '@/services/couponApi'
import type { CouponDetailsResponse } from '@/types/coupon'

export function useCouponDetails(id: string | undefined, enabled: boolean) {
  const [data, setData] = useState<CouponDetailsResponse | null>(null)
  const [error, setError] = useState<{ message: string; status?: number } | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt(value => value + 1), [])

  useEffect(() => {
    if (!enabled || !id) { setIsLoading(false); return }
    const couponId = id
    const controller = new AbortController()
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await couponApi.getById(couponId, controller.signal)
        if (!controller.signal.aborted) setData(response)
      } catch (caught: unknown) {
        if (!controller.signal.aborted) setError({ message: getApiErrorMessage(caught), status: getApiErrorStatus(caught) })
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [attempt, enabled, id])

  return { data, error, isLoading, retry }
}
