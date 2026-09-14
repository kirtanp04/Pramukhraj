import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPostResponse, apiPutResponse, type ApiResponse } from '@/lib/apiClient'
import type {
  CreateProviderCredentialRequest,
  ProviderCredentialResponse,
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
  create(payload: CreateProviderCredentialRequest, signal?: AbortSignal): Promise<ApiResponse<string>> {
    return apiPostResponse<string>(ApiPath.admin.providerCredentials.create, payload, { signal })
  },
  update(
    providerKey: string,
    payload: UpdateProviderCredentialRequest,
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
}
