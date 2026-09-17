import { ApiPath } from "@/constants/apiPaths";
import { apiDelete, apiGet, apiPatchResponse, apiPost, apiPutResponse } from "@/lib/apiClient";
import type { CheckoutSession } from "../types/checkout.types";

export const checkoutApi = {
  initialize: (shippingAddressId?: string | null, billingAddressId?: string | null) => apiPost<CheckoutSession>(ApiPath.customer.checkout.sessions, { shippingAddressId: shippingAddressId ?? null, billingAddressId: billingAddressId ?? null }),
  get: (id: string) => apiGet<CheckoutSession>(ApiPath.customer.checkout.session(id)),
  updateAddress: async (id: string, shippingAddressId: string | null, billingAddressId: string | null) => (await apiPatchResponse<CheckoutSession>(ApiPath.customer.checkout.address(id), { shippingAddressId, billingAddressId })).data,
  applyCoupon: async (id: string, couponCode: string) => (await apiPutResponse<CheckoutSession>(ApiPath.customer.checkout.coupon(id), { couponCode })).data,
  removeCoupon: (id: string) => apiDelete<CheckoutSession>(ApiPath.customer.checkout.coupon(id)),
  refresh: (id: string) => apiPost<CheckoutSession>(ApiPath.customer.checkout.refresh(id)),
};
