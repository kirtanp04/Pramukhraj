import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPostResponse, apiPutResponse, type ApiResponse } from '@/lib/apiClient'
import type {
  CreateProviderCredentialRequest,
  ProviderCredentialResponse,
  RazorpayCredentials,
  ShiprocketCredentials,
  TwilioCredentials,
  UpdateProviderCredentialRequest,
} from '@/types/providerCredentials'

export const providerCredentialsApi = {
  getByKey<TCredentials = Record<string, unknown>>(providerKey: string, signal?: AbortSignal) {
    return apiGet<ProviderCredentialResponse<TCredentials>>(
      ApiPath.admin.providerCredentials.getByKey(providerKey),
      { signal },
    )
  },
  create<TCredentials>(payload: CreateProviderCredentialRequest<TCredentials>, signal?: AbortSignal): Promise<ApiResponse<string>> {
    return apiPostResponse<string>(ApiPath.admin.providerCredentials.create, payload, { signal })
  },
  update<TCredentials>(
    providerKey: string,
    payload: UpdateProviderCredentialRequest<TCredentials>,
    signal?: AbortSignal,
  ): Promise<ApiResponse<string>> {
    return apiPutResponse<string>(ApiPath.admin.providerCredentials.update(providerKey), payload, { signal })
  },
  getTwilio(providerKey: string, signal?: AbortSignal) {
    return apiGet<ProviderCredentialResponse<TwilioCredentials>>(
      ApiPath.admin.providerCredentials.getByKey(providerKey),
      { signal },
    )
  },
  getRazorpay(providerKey: string, signal?: AbortSignal) {
    return apiGet<ProviderCredentialResponse<RazorpayCredentials>>(
      ApiPath.admin.providerCredentials.getByKey(providerKey),
      { signal },
    )
  },
  getShiprocket(providerKey: string, signal?: AbortSignal) {
    return apiGet<ProviderCredentialResponse<ShiprocketCredentials>>(
      ApiPath.admin.providerCredentials.getByKey(providerKey),
      { signal },
    )
  },
}
