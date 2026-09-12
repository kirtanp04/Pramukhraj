import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { reviewApi } from '@/services/reviewApi'
import type { AdminReviewListItem } from '@/types/review'

const REVIEW_PAGE_SIZE = 10

export function useAdminReviews(page: number) {
  const [items, setItems] = useState<AdminReviewListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const loadPage = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setError(null)
    try {
      const reviews = await reviewApi.getAdminList(page, controller.signal)
      if (!controller.signal.aborted) setItems(reviews ?? [])
    } catch (loadError: unknown) {
      if (!controller.signal.aborted) {
        setItems([])
        setError(getApiErrorMessage(loadError))
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
      if (controllerRef.current === controller) controllerRef.current = null
    }
  }, [page])

  useEffect(() => {
    void loadPage()
    return () => controllerRef.current?.abort()
  }, [loadPage])

  return {
    items,
    isInitialLoading: isLoading && items.length === 0,
    isPageFetching: isLoading && items.length > 0,
    error,
    retry: loadPage,
    pagination: {
      page,
      pageSize: REVIEW_PAGE_SIZE,
      hasPreviousPage: page > 1,
      hasNextPage: items.length === REVIEW_PAGE_SIZE,
    },
  }
}
