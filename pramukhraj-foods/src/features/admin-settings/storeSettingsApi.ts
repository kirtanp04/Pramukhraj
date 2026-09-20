import { ApiPath } from '@/constants/apiPaths'
import { apiGet, apiPutResponse } from '@/lib/apiClient'
import type { StoreSettings, StoreSettingsFormValues } from './types'

export const storeSettingsApi = {
  get: (signal?: AbortSignal) => apiGet<StoreSettings>(ApiPath.admin.settings.get, { signal }),
  update: (values: StoreSettingsFormValues) => apiPutResponse<StoreSettings>(ApiPath.admin.settings.update, values),
}
