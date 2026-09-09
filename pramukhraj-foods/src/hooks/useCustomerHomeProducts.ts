import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import { toCustomerHomeProductGroups } from '@/lib/customerProductMappings'
import { customerProductApi } from '@/services/customerProductApi'
import type { CustomerHomeProductGroups } from '@/types/customerProduct'

const emptyGroups: CustomerHomeProductGroups = {
  featured: [],
  bestSellers: [],
  newArrivals: [],
  trending: [],
}

export function useCustomerHomeProducts() {
  const [groups, setGroups] = useState<CustomerHomeProductGroups>(emptyGroups)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const activeRequest = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setIsLoading(true)
    setError(null)

    try {
      const response = await customerProductApi.getHomeGroups(controller.signal)
      if (controller.signal.aborted) return
      setGroups(response ? toCustomerHomeProductGroups(response) : emptyGroups)
    } catch (requestError: unknown) {
      if (controller.signal.aborted) return
      setGroups(emptyGroups)
      setError(getApiErrorMessage(requestError))
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }, [])

  useEffect(() => {
    void load()
    return () => activeRequest.current?.abort()
  }, [load])

  return { groups, isLoading, error, retry: load }
}
