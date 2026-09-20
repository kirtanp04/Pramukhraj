export interface RazorpayCheckoutData {
  orderId: string;
  orderNumber: string;
  keyId: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  customerName: string;
  customerEmail: string | null;
  customerMobile: string;
  paymentExpiresOn: string;
  storeName: string;
  isUpiPaymentEnabled: boolean;
  isCardPaymentEnabled: boolean;
}

export interface PlaceOrderResult {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  payment: RazorpayCheckoutData | null;
  paymentError: string | null;
}

export interface PaymentVerificationResult {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  isPaid: boolean;
}

export interface PaymentStatusResult extends PaymentVerificationResult {
  canRetry: boolean;
  paymentExpiresOn: string;
}

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PendingOrderItem {
  productId: string;
  productVariantId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitMrp: number;
  lineTotal: number;
  weight: number;
  weightUnit: string;
}

export interface PendingOrderAddress {
  type: string;
  recipientName: string;
  mobileNumber: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PendingOrderSummary {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentExpiresOn: string;
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
  couponCode: string | null;
  selectedCourierName: string | null;
  estimatedDeliveryOn: string | null;
  storeName: string;
  shippingAddress: PendingOrderAddress | null;
  billingAddress: PendingOrderAddress | null;
  items: PendingOrderItem[];
  canRetry: boolean;
  isPaid: boolean;
}

export interface CancelPendingOrderResult {
  orderId: string;
  orderNumber: string;
  status: string;
  message: string;
}
