import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage, getApiErrorStatus, type ApiResponse } from '@/lib/apiClient'
import { providerCredentialsApi } from '@/services/providerCredentialsApi'
import {
  PROVIDER_KEYS,
  type ProviderCredentialResponse,
  type ShiprocketCredentials,
} from '@/types/providerCredentials'

export function useShiprocketCredentials() {
  const mountedRef = useRef(true)
  const activeLoadRef = useRef<AbortController | null>(null)
  const [data, setData] = useState<ProviderCredentialResponse<ShiprocketCredentials> | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<{ message: string; status?: number } | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      activeLoadRef.current?.abort()
    }
  }, [])

  const load = useCallback(async () => {
    activeLoadRef.current?.abort()
    const controller = new AbortController()
    activeLoadRef.current = controller
    setIsLoading(true)
    setLoadError(null)

    try {
      const response = await providerCredentialsApi.getShiprocket(PROVIDER_KEYS.shiprocket, controller.signal)
      if (!controller.signal.aborted) {
        setData(response)
        setIsConfigured(response !== null)
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        if (getApiErrorStatus(error) === 404) {
          setData(null)
          setIsConfigured(false)
        } else {
          setLoadError({ message: getApiErrorMessage(error), status: getApiErrorStatus(error) })
        }
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
      if (activeLoadRef.current === controller) activeLoadRef.current = null
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const save = useCallback(async (credentials: ShiprocketCredentials): Promise<ApiResponse<string>> => {
    setIsSaving(true)
    try {
      const response = isConfigured
        ? await providerCredentialsApi.update(PROVIDER_KEYS.shiprocket, { credentials, isActive: true })
        : await providerCredentialsApi.create({
            providerKey: PROVIDER_KEYS.shiprocket,
            credentials,
            isActive: true,
          })

      if (mountedRef.current) {
        const now = new Date().toISOString()
        setData(current => ({
          id: response.data ?? current?.id ?? '',
          providerKey: PROVIDER_KEYS.shiprocket,
          credentials,
          isActive: true,
          createdOn: current?.createdOn ?? now,
          updatedOn: isConfigured ? now : null,
        }))
        setIsConfigured(true)
      }
      return response
    } finally {
      if (mountedRef.current) setIsSaving(false)
    }
  }, [isConfigured])

  return { data, isConfigured, isLoading, isSaving, loadError, retry: load, save }
}
