export interface CustomerOrderItemSummary {
  productId: string;
  productVariantId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CustomerOrderListItem {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  paymentStatus: string;
  shipmentStatus?: string | null;
  courierName?: string | null;
  awbCode?: string | null;
  trackingUrl?: string | null;
  estimatedDeliveryOn?: string | null;
  grandTotal: number;
  currency: string;
  itemCount: number;
  items: CustomerOrderItemSummary[];
}

export interface CustomerOrderListResult {
  orders: CustomerOrderListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PendingOrderAddress {
  recipientName: string;
  mobileNumber: string;
  email?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PendingOrderItem {
  productId: string;
  productVariantId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string;
  weight: number;
  weightUnit: string;
  quantity: number;
  unitPrice: number;
  unitMrp: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface ShipmentActivityItem {
  id: string;
  activity: string;
  location?: string | null;
  status?: string | null;
  date: string;
}

export interface CustomerOrderShipmentDetail {
  shipmentId: string;
  status: string;
  courierName?: string | null;
  awbCode?: string | null;
  trackingUrl?: string | null;
  pickupScheduledOn?: string | null;
  shippedOn?: string | null;
  deliveredOn?: string | null;
  estimatedDeliveryOn?: string | null;
  activities: ShipmentActivityItem[];
}

export interface CustomerOrderDetail {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  paymentStatus: string;
  shipmentStatus?: string | null;
  subtotal: number;
  itemDiscountAmount: number;
  couponDiscountAmount: number;
  customerShippingAmount: number;
  taxAmount: number;
  productTaxAmount: number;
  paymentServiceTaxAmount: number;
  productTaxRatePercent: number;
  paymentServiceTaxRatePercent: number;
  grandTotal: number;
  currency: string;
  couponCode?: string | null;
  customerNote?: string | null;
  storeName: string;
  shippingAddress?: PendingOrderAddress | null;
  billingAddress?: PendingOrderAddress | null;
  items: PendingOrderItem[];
  shipment?: CustomerOrderShipmentDetail | null;
  canCancel: boolean;
}

export interface CustomerOrderTracking {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  shipmentId?: string | null;
  shipmentStatus?: string | null;
  courierName?: string | null;
  awbCode?: string | null;
  trackingUrl?: string | null;
  pickupScheduledOn?: string | null;
  shippedOn?: string | null;
  deliveredOn?: string | null;
  estimatedDeliveryOn?: string | null;
  activities: ShipmentActivityItem[];
}

