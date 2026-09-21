export type AdminShipmentStatus =
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

export type AdminShipmentTabStatus =
  | 'ALL'
  | 'PendingPickup'
  | 'InTransit'
  | 'Delivered'
  | 'FailedOrRto'

export interface AdminShipmentCustomerSummary {
  customerId: string
  fullName: string
  mobileNumber: string
  email: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  isBlocked: boolean
}

export interface AdminShipmentOrderSummary {
  orderId: string
  orderNumber: string
  orderStatus: string
  paymentStatus: string
  grandTotal: number
  currency: string
  itemCount: number
  selectedCourierName: string | null
}

export interface AdminShipmentListItem {
  id: string
  orderId: string
  orderNumber: string
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
  status: AdminShipmentStatus | string
  providerStatus: string | null
  pickupScheduledOn: string | null
  shippedOn: string | null
  deliveredOn: string | null
  lastError: string | null
  createdOn: string
  updatedOn: string
  customer: AdminShipmentCustomerSummary
  order: AdminShipmentOrderSummary
  activityCount: number
  latestActivity: string | null
  latestLocation: string | null
}

export interface AdminShipmentSummary {
  total: number
  pendingPickup: number
  inTransit: number
  delivered: number
  failedOrRto: number
  totalShippingCharges: number
}

export interface AdminShipmentListPage {
  items: AdminShipmentListItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  summary: AdminShipmentSummary
}

export interface AdminShipmentActivity {
  id: string
  shipmentId: string
  activity: string
  location: string | null
  status: string | null
  date: string
  createdOn: string
}

export interface AdminShipmentDetailItem {
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
  lineTotal: number
}

export interface AdminShipmentAddress {
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

export interface AdminShipmentOrderDetail {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  createdOn: string
  subtotal: number
  shippingAmount: number
  taxAmount: number
  grandTotal: number
  currency: string
  customerNote: string | null
  shippingAddress: AdminShipmentAddress | null
  billingAddress: AdminShipmentAddress | null
  items: AdminShipmentDetailItem[]
}

export interface AdminShipmentDetail {
  id: string
  orderId: string
  orderNumber: string
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
  status: AdminShipmentStatus | string
  providerStatus: string | null
  providerStatusCode: number | null
  pickupScheduledOn: string | null
  shippedOn: string | null
  deliveredOn: string | null
  lastError: string | null
  createdOn: string
  updatedOn: string
  concurrencyStamp: string
  customer: AdminShipmentCustomerSummary
  order: AdminShipmentOrderDetail
  activities: AdminShipmentActivity[]
}

export interface AdminShipmentListQuery {
  pageNumber: number
  pageSize: number
  search?: string
  status?: string
  sortBy?: string
  sortDirection?: string
}

