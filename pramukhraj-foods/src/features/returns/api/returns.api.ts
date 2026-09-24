import { ApiPath } from "@/constants/apiPaths";
import { apiGet, apiPostResponse } from "@/lib/apiClient";
import type {
  ReturnEligibility,
  CreateReturnRequest,
  CustomerReturnDetails,
  CustomerReturnListPage,
} from "../types";

export const returnsApi = {
  getEligibility: (orderId: string) =>
    apiGet<ReturnEligibility>(ApiPath.customer.returns.eligibility(orderId)),

  create: (orderId: string, payload: CreateReturnRequest) =>
    apiPostResponse<CustomerReturnDetails>(
      ApiPath.customer.returns.create(orderId),
      payload
    ),

  getList: (params?: { page?: number; pageSize?: number }) =>
    apiGet<CustomerReturnListPage>(ApiPath.customer.returns.list(params)),

  getDetails: (returnId: string) =>
    apiGet<CustomerReturnDetails>(ApiPath.customer.returns.detail(returnId)),

  cancel: (returnId: string) =>
    apiPostResponse<boolean>(ApiPath.customer.returns.cancel(returnId)),
};
