import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { adminActionApi } from '@/services/adminActionApi'
import type { AdminActionListItem } from '@/types/adminAction'
import type { PaginationMetadata } from '@/types/common'

export const ADMIN_ACTION_PAGE_SIZE = 30

interface AdminActionsState {
  actions: AdminActionListItem[]
  isLoading: boolean
  error: string | null
}

export function useAdminActions(page: number) {
  const [state, setState] = useState<AdminActionsState>({
    actions: [],
    isLoading: true,
    error: null,
  })
  const activeRequest = useRef<AbortController | null>(null)

  const loadPage = useCallback(async () => {
    activeRequest.current?.abort()

    const controller = new AbortController()
    activeRequest.current = controller
    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const actions = (await adminActionApi.getList(page, controller.signal)) ?? []
      if (controller.signal.aborted) return
      setState({ actions, isLoading: false, error: null })
    } catch (error: unknown) {
      if (controller.signal.aborted) return
      setState({ actions: [], isLoading: false, error: getApiErrorMessage(error) })
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }, [page])

  useEffect(() => {
    const requestTimer = window.setTimeout(() => void loadPage(), 0)
    return () => {
      window.clearTimeout(requestTimer)
      activeRequest.current?.abort()
    }
  }, [loadPage])

  const pagination: PaginationMetadata = {
    page,
    pageSize: ADMIN_ACTION_PAGE_SIZE,
    hasPreviousPage: page > 1,
    hasNextPage: state.actions.length === ADMIN_ACTION_PAGE_SIZE,
  }

  return {
    actions: state.actions,
    pagination,
    isInitialLoading: state.isLoading && state.actions.length === 0,
    isPageFetching: state.isLoading && state.actions.length > 0,
    error: state.error,
    retry: loadPage,
  }
}
