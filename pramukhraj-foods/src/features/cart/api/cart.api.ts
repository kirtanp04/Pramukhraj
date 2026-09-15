import { ApiPath } from "@/constants/apiPaths";
import {
  apiDelete,
  apiGet,
  apiPatchResponse,
  apiPostResponse,
} from "@/lib/apiClient";
import type { CartResponse, GuestCartItem } from "../types/cart.types";

export const cartApi = {
  get: () => apiGet<CartResponse>(ApiPath.customer.cart.get),
  add: async (productVariantId: string, quantity: number) => {
    const response = await apiPostResponse<CartResponse>(ApiPath.customer.cart.items, {
      productVariantId,
      quantity,
    });
    return response.data;
  },
  updateQuantity: async (cartItemId: string, quantity: number, cartVersion: number) => {
    const response = await apiPatchResponse<CartResponse>(
      ApiPath.customer.cart.item(cartItemId),
      { quantity, cartVersion },
    );
    return response.data;
  },
  remove: (cartItemId: string) =>
    apiDelete<CartResponse>(ApiPath.customer.cart.item(cartItemId)),
  clear: () => apiDelete<CartResponse>(ApiPath.customer.cart.get),
  updateSelection: async (
    cartItemId: string,
    isSelected: boolean,
    cartVersion: number
  ) => {
    const response = await apiPatchResponse<CartResponse>(
      ApiPath.customer.cart.selection(cartItemId),
      { isSelected, cartVersion }
    );
    return response.data;
  },
  changeVariant: async (
    cartItemId: string,
    productVariantId: string,
    cartVersion: number
  ) => {
    const response = await apiPatchResponse<CartResponse>(ApiPath.customer.cart.variant(cartItemId), {
      productVariantId,
      cartVersion,
    });
    return response.data;
  },
  resolveGuest: async (items: GuestCartItem[], signal?: AbortSignal) => {
    const response = await apiPostResponse<CartResponse>(
      ApiPath.guest.cart.resolve,
      { items },
      { signal }
    );
    return response.data;
  },
  merge: async (items: GuestCartItem[], mergeRequestId: string) => {
    const response = await apiPostResponse<CartResponse>(ApiPath.customer.cart.merge, {
      items,
      mergeRequestId,
    });
    return response.data;
  },
};
