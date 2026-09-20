import { ApiPath } from "@/constants/apiPaths";
import { apiGet } from "@/lib/apiClient";
import type {
  CustomerOrderDetail,
  CustomerOrderListResult,
  CustomerOrderTracking,
  PublicOrderTracking,
} from "../types/order.types";

export const ordersApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string }) =>
    apiGet<CustomerOrderListResult>(ApiPath.customer.orders.list(params)),
  getById: (orderId: string) =>
    apiGet<CustomerOrderDetail>(ApiPath.customer.orders.detail(orderId)),
  getTracking: (orderId: string) =>
    apiGet<CustomerOrderTracking>(ApiPath.customer.orders.tracking(orderId)),
  trackPublic: (query: string) =>
    apiGet<PublicOrderTracking>(ApiPath.customer.orders.trackPublic(query)),
};

