export const EMAIL_TEMPLATE_CATEGORY = {
  Account: 1,
  Order: 2,
  Payment: 3,
  Shipping: 4,
  Marketing: 5,
  System: 6,
} as const

export type EmailTemplateCategory = typeof EMAIL_TEMPLATE_CATEGORY[keyof typeof EMAIL_TEMPLATE_CATEGORY]

export const EMAIL_TEMPLATE_CATEGORY_LABELS: Record<EmailTemplateCategory, string> = {
  1: 'Account', 2: 'Order', 3: 'Payment', 4: 'Shipping', 5: 'Marketing', 6: 'System',
}

export interface EmailTemplateAttachmentDefinition {
  name: string
  contentType: string
  sourceVariable: string
  isRequired: boolean
}

export interface EmailTemplateWriteRequest {
  key: string
  name: string
  description: string
  category: EmailTemplateCategory
  subject: string
  designJson: string
  htmlContent: string
  plainTextContent: string
  variables: string[]
  attachments: EmailTemplateAttachmentDefinition[]
  isActive: boolean
}

export interface EmailTemplateResponse extends EmailTemplateWriteRequest {
  id: string
  createdOn: string
  updatedOn: string
}

export interface EmailTemplateListItem {
  id: string
  key: string
  name: string
  description: string | null
  category: EmailTemplateCategory
  subject: string
  isActive: boolean
  updatedOn: string
}
