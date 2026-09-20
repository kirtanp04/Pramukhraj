import { ApiPath } from "@/constants/apiPaths";
import { apiGet, apiPost } from "@/lib/apiClient";
import type {
  CancelPendingOrderResult,
  PaymentStatusResult,
  PaymentVerificationResult,
  PendingOrderSummary,
  PlaceOrderResult,
  RazorpayCheckoutData,
  RazorpaySuccess,
} from "../types/payment.types";

export const paymentApi = {
  placeOrder: (checkoutSessionId: string, idempotencyKey: string) =>
    apiPost<PlaceOrderResult>(ApiPath.customer.checkout.placeOrder, { checkoutSessionId }, { headers: { "Idempotency-Key": idempotencyKey } }),
  retry: (orderId: string) => apiPost<RazorpayCheckoutData>(ApiPath.customer.payments.retry(orderId)),
  status: (orderId: string) => apiGet<PaymentStatusResult>(ApiPath.customer.payments.status(orderId)),
  summary: (orderId: string) => apiGet<PendingOrderSummary>(ApiPath.customer.payments.summary(orderId)),
  cancel: (orderId: string) => apiPost<CancelPendingOrderResult>(ApiPath.customer.payments.cancel(orderId)),
  verify: (orderId: string, response: RazorpaySuccess) => apiPost<PaymentVerificationResult>(
    ApiPath.customer.payments.verify(orderId),
    { razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }
  ),
};
