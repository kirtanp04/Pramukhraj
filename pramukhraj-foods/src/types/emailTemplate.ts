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

export const EMAIL_TEMPLATE_STARTERS = [
  { key: 'WELCOME', name: 'Welcome Email', category: 1 as EmailTemplateCategory, subject: 'Welcome to Pramukhraj Foods, {{customer_name}}!', variables: ['customer_name', 'customer_email'] },
  { key: 'ORDER_SUCCESS', name: 'Order Confirmation', category: 2 as EmailTemplateCategory, subject: 'Your order {{order_number}} is confirmed', variables: ['customer_name', 'order_number', 'order_total', 'order_url'] },
  { key: 'PAYMENT_SUCCESS', name: 'Payment Confirmation', category: 3 as EmailTemplateCategory, subject: 'Payment received for order {{order_number}}', variables: ['customer_name', 'order_number', 'payment_id', 'amount', 'order_url'] },
  { key: 'INVOICE', name: 'Invoice', category: 2 as EmailTemplateCategory, subject: 'Invoice for order {{order_number}}', variables: ['customer_name', 'order_number', 'invoice_number', 'invoice_url'] },
  { key: 'SHIPMENT', name: 'Shipment Notification', category: 4 as EmailTemplateCategory, subject: 'Your order {{order_number}} is on its way', variables: ['customer_name', 'order_number', 'tracking_number', 'tracking_url'] },
  { key: 'DELIVERED', name: 'Order Delivered', category: 4 as EmailTemplateCategory, subject: 'Your order {{order_number}} was delivered', variables: ['customer_name', 'order_number', 'order_url'] },
  { key: 'ORDER_CANCELLED', name: 'Order Cancelled', category: 2 as EmailTemplateCategory, subject: 'Your order {{order_number}} was cancelled', variables: ['customer_name', 'order_number', 'refund_amount'] },
  { key: 'REFUND_PROCESSED', name: 'Refund Processed', category: 3 as EmailTemplateCategory, subject: 'Your refund for {{order_number}} was processed', variables: ['customer_name', 'order_number', 'refund_amount', 'refund_id'] },
  { key: 'PASSWORD_RESET', name: 'Password Reset', category: 1 as EmailTemplateCategory, subject: 'Reset your Pramukhraj Foods password', variables: ['customer_name', 'reset_url', 'expires_in'] },
] as const
