import { ApiPath } from '@/constants/apiPaths'
import { apiDelete, apiGet, apiPostResponse, apiPutResponse } from '@/lib/apiClient'
import type { EmailTemplateListItem, EmailTemplateResponse, EmailTemplateWriteRequest } from '@/types/emailTemplate'

export const emailTemplateApi = {
  getList(signal?: AbortSignal) {
    return apiGet<EmailTemplateListItem[]>(ApiPath.admin.emailTemplates.list, { signal })
  },
  getById(id: string, signal?: AbortSignal) {
    return apiGet<EmailTemplateResponse>(ApiPath.admin.emailTemplates.getById(id), { signal })
  },
  create(payload: EmailTemplateWriteRequest) {
    return apiPostResponse<string>(ApiPath.admin.emailTemplates.create, payload)
  },
  update(id: string, payload: EmailTemplateWriteRequest) {
    return apiPutResponse<string>(ApiPath.admin.emailTemplates.update(id), payload)
  },
  delete(id: string) {
    return apiDelete<{ id: string }>(ApiPath.admin.emailTemplates.delete(id))
  },
  seedDefaults(overwrite: boolean = false) {
    return apiPostResponse<number>(ApiPath.admin.emailTemplates.seedDefaults(overwrite), null)
  },
}
