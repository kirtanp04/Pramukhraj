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
