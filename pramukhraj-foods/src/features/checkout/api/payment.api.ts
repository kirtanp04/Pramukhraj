import { ApiPath } from "@/constants/apiPaths";
import { apiGet, apiPost } from "@/lib/apiClient";
import type { PaymentStatusResult, PaymentVerificationResult, PlaceOrderResult, RazorpayCheckoutData, RazorpaySuccess } from "../types/payment.types";

export const paymentApi = {
  placeOrder: (checkoutSessionId: string, idempotencyKey: string) =>
    apiPost<PlaceOrderResult>(ApiPath.customer.checkout.placeOrder, { checkoutSessionId }, { headers: { "Idempotency-Key": idempotencyKey } }),
  retry: (orderId: string) => apiPost<RazorpayCheckoutData>(ApiPath.customer.payments.retry(orderId)),
  status: (orderId: string) => apiGet<PaymentStatusResult>(ApiPath.customer.payments.status(orderId)),
  verify: (orderId: string, response: RazorpaySuccess) => apiPost<PaymentVerificationResult>(
    ApiPath.customer.payments.verify(orderId),
    { razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }
  ),
};
