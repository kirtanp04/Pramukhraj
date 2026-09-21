export type AdminPaymentStatus =
  | 'Pending'
  | 'ProviderOrderCreated'
  | 'Paid'
  | 'Failed'
  | 'Expired'
  | 'VerificationFailed'

export interface AdminPaymentCustomerSummary {
  customerId: string
  fullName: string
  mobileNumber: string
  email: string | null
  city: string | null
  state: string | null
  isBlocked: boolean
}

export interface AdminPaymentOrderSummary {
  orderId: string
  orderNumber: string
  orderStatus: string
  grandTotal: number
  currency: string
  itemCount: number
}

export interface AdminPaymentListItem {
  id: string
  orderId: string
  orderNumber: string
  idempotencyKey: string
  providerOrderId: string | null
  providerPaymentId: string | null
  status: AdminPaymentStatus | string
  amountPaise: number
  amount: number
  currency: string
  lastError: string | null
  expiresOn: string
  createdOn: string
  updatedOn: string
  paidOn: string | null
  customer: AdminPaymentCustomerSummary
  order: AdminPaymentOrderSummary
}

export interface AdminPaymentSummary {
  total: number
  paid: number
  pending: number
  failed: number
  expired: number
  totalPaidAmount: number
}

export interface AdminPaymentListPage {
  items: AdminPaymentListItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  summary: AdminPaymentSummary
}

export interface AdminPaymentTransactionDetail {
  id: string
  paymentId: string
  type: string
  providerReference: string | null
  status: string
  safePayloadJson: string | null
  createdOn: string
}

export interface AdminPaymentDetailItem {
  id: string
  productId: string
  productVariantId: string
  productName: string
  productSlug: string
  variantName: string
  sku: string
  weight: number
  weightUnit: string
  quantity: number
  unitPrice: number
  unitMrp: number
  taxPercentage: number
  discountAmount: number
  taxAmount: number
  lineTotal: number
}

export interface AdminPaymentAddress {
  type: string
  recipientName: string
  mobileNumber: string
  email: string | null
  addressLine1: string
  addressLine2: string | null
  landmark: string | null
  city: string
  state: string
  postalCode: string
  country: string
}

export interface AdminPaymentOrderDetail {
  id: string
  orderNumber: string
  status: string
  createdOn: string
  subtotal: number
  itemDiscountAmount: number
  couponDiscountAmount: number
  shippingAmount: number
  taxAmount: number
  grandTotal: number
  currency: string
  couponCode: string | null
  customerNote: string | null
  shippingAddress: AdminPaymentAddress | null
  billingAddress: AdminPaymentAddress | null
  items: AdminPaymentDetailItem[]
}

export interface AdminPaymentShipmentSummary {
  awbCode: string | null
  courierName: string | null
  status: string
  trackingUrl: string | null
  estimatedDeliveryOn: string | null
}

export interface AdminPaymentDetail {
  id: string
  orderId: string
  orderNumber: string
  idempotencyKey: string
  providerOrderId: string | null
  providerPaymentId: string | null
  status: AdminPaymentStatus | string
  amountPaise: number
  amount: number
  currency: string
  lastError: string | null
  expiresOn: string
  createdOn: string
  updatedOn: string
  paidOn: string | null
  concurrencyStamp: string
  customer: AdminPaymentCustomerSummary
  order: AdminPaymentOrderDetail
  shipment: AdminPaymentShipmentSummary | null
  transactions: AdminPaymentTransactionDetail[]
}

export interface AdminPaymentListQuery {
  pageNumber: number
  pageSize: number
  search?: string
  status?: string
  sortBy?: string
  sortDirection?: string
}

