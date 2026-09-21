export type AdminOrderStatus =
  | 'PendingPayment'
  | 'Confirmed'
  | 'PaymentFailed'
  | 'Cancelled'
  | 'Expired'

export type AdminOrderPaymentStatus =
  | 'Pending'
  | 'ProviderOrderCreated'
  | 'Paid'
  | 'Failed'
  | 'Expired'
  | 'VerificationFailed'

export type AdminOrderShipmentStatus =
  | 'Created'
  | 'CourierAssigned'
  | 'AwbAssigned'
  | 'PickupScheduled'
  | 'PickedUp'
  | 'InTransit'
  | 'OutForDelivery'
  | 'Delivered'
  | 'DeliveryFailed'
  | 'RtoInitiated'
  | 'RtoDelivered'
  | 'Cancelled'

export interface AdminOrderCustomerSummary {
  customerId: string
  fullName: string
  mobileNumber: string
  email: string | null
  city: string | null
  state: string | null
  isBlocked: boolean
}

export interface AdminOrderItemSummary {
  productId: string
  productVariantId: string
  productName: string
  productSlug: string
  variantName: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface AdminOrderListItem {
  id: string
  orderNumber: string
  createdOn: string
  orderStatus: AdminOrderStatus | string
  paymentStatus: AdminOrderPaymentStatus | string
  shipmentStatus: AdminOrderShipmentStatus | string | null
  courierName: string | null
  awbCode: string | null
  trackingUrl: string | null
  estimatedDeliveryOn: string | null
  grandTotal: number
  currency: string
  itemCount: number
  customer: AdminOrderCustomerSummary
  items: AdminOrderItemSummary[]
}

export interface AdminOrderSummary {
  total: number
  pendingPayment: number
  confirmed: number
  paymentFailed: number
  cancelled: number
  expired: number
}

export interface AdminOrderListPage {
  items: AdminOrderListItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  summary: AdminOrderSummary
}

export interface AdminOrderListParams {
  pageNumber: number
  pageSize: number
  search?: string
  status?: string
  paymentStatus?: string
  shipmentStatus?: string
  sortBy?: string
  sortDirection?: string
}

export interface AdminOrderDetailItem {
  id: string
  productId: string
  productVariantId: string
  productName: string
  productSlug: string
  variantName: string
  sku: string
  hsnCode: string | null
  weight: number
  weightUnit: string
  quantity: number
  unitPrice: number
  unitMrp: number
  taxPercentage: number
  taxableAmount: number
  discountAmount: number
  taxAmount: number
  lineTotal: number
}

export interface AdminOrderAddress {
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

export interface AdminOrderCustomerDetail {
  id: string
  fullName: string
  mobileNumber: string
  email: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  isMobileVerified: boolean
  isEmailVerified: boolean
  isProfileCompleted: boolean
  isBlocked: boolean
  blockReason: string | null
  createdOn: string
}

export interface AdminPaymentTransaction {
  id: string
  type: string
  providerReference: string | null
  status: string
  safePayloadJson: string | null
  createdOn: string
}

export interface AdminOrderPayment {
  id: string
  idempotencyKey: string
  providerOrderId: string | null
  providerPaymentId: string | null
  status: string
  amountPaise: number
  amountInr: number
  currency: string
  lastError: string | null
  expiresOn: string
  createdOn: string
  paidOn: string | null
  transactions: AdminPaymentTransaction[]
}

export interface AdminShipmentActivity {
  id: string
  activity: string
  location: string | null
  status: string | null
  date: string
}

export interface AdminOrderShipment {
  id: string
  providerOrderId: number
  providerShipmentId: number
  courierCompanyId: number | null
  courierName: string | null
  awbCode: string | null
  trackingUrl: string | null
  labelUrl: string | null
  manifestUrl: string | null
  providerShippingCharge: number
  estimatedDeliveryOn: string | null
  status: string
  providerStatus: string | null
  providerStatusCode: number | null
  pickupScheduledOn: string | null
  shippedOn: string | null
  deliveredOn: string | null
  lastError: string | null
  createdOn: string
  updatedOn: string
  activities: AdminShipmentActivity[]
}

export interface AdminOrderStatusHistory {
  id: string
  status: string
  note: string | null
  createdOn: string
}

export interface AdminInventoryReservation {
  id: string
  productVariantId: string
  quantity: number
  status: string
  expiresOn: string
  createdOn: string
  completedOn: string | null
  releasedOn: string | null
}

export interface AdminOrderDetail {
  id: string
  orderNumber: string
  status: AdminOrderStatus | string
  createdOn: string
  updatedOn: string
  paymentExpiresOn: string
  checkoutSessionId: string
  subtotal: number
  itemDiscountAmount: number
  couponDiscountAmount: number
  shippingAmount: number
  providerShippingCost: number
  taxAmount: number
  productTaxAmount: number
  paymentServiceTaxAmount: number
  productTaxRatePercent: number
  paymentServiceTaxRatePercent: number
  grandTotal: number
  currency: string
  couponId: string | null
  couponCode: string | null
  customerNote: string | null
  customer: AdminOrderCustomerDetail
  shippingAddress: AdminOrderAddress | null
  billingAddress: AdminOrderAddress | null
  items: AdminOrderDetailItem[]
  payments: AdminOrderPayment[]
  shipments: AdminOrderShipment[]
  statusHistory: AdminOrderStatusHistory[]
  inventoryReservations: AdminInventoryReservation[]
}

