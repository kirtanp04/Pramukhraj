import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage, getApiErrorStatus, type ApiResponse } from '@/lib/apiClient'
import { homepageCmsApi } from '@/services/homepageCmsApi'
import type { AdminHomepageCmsResponse, HomepageCmsWriteRequest } from '@/types/homepageCms'

export function useAdminHomepageCms() {
  const mountedRef = useRef(true)
  const activeRequest = useRef<AbortController | null>(null)
  const [data, setData] = useState<AdminHomepageCmsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<{ message: string; status?: number } | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      activeRequest.current?.abort()
    }
  }, [])

  const load = useCallback(async () => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await homepageCmsApi.getAdmin(controller.signal)
      if (!controller.signal.aborted) setData(response)
    } catch (error) {
      if (!controller.signal.aborted) {
        setLoadError({ message: getApiErrorMessage(error), status: getApiErrorStatus(error) })
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const save = useCallback(async (values: HomepageCmsWriteRequest): Promise<ApiResponse<number>> => {
    setIsSaving(true)
    try {
      const response = await homepageCmsApi.replace(values)
      if (mountedRef.current) {
        const now = new Date().toISOString()
        setData(current => ({
          ...values,
          id: 1,
          createdOn: current?.createdOn ?? now,
          updatedOn: now,
        }))
      }
      return response
    } finally {
      if (mountedRef.current) setIsSaving(false)
    }
  }, [])

  return { data, isLoading, isSaving, loadError, retry: load, save }
}
