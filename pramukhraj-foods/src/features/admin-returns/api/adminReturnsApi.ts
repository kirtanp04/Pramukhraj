import { ApiPath } from "@/constants/apiPaths";
import { apiGet, apiPostResponse } from "@/lib/apiClient";
import type {
  AdminReturnFilterParams,
  AdminReturnListPage,
  AdminReturnDetails,
  AdminApproveReturnPayload,
  AdminRejectReturnPayload,
  AdminInspectReturnPayload,
  AdminProcessRefundPayload,
} from "../types";

export const adminReturnsApi = {
  getList: (filter?: AdminReturnFilterParams) =>
    apiGet<AdminReturnListPage>(ApiPath.admin.returns.list(filter)),

  getDetails: (returnId: string) =>
    apiGet<AdminReturnDetails>(ApiPath.admin.returns.details(returnId)),

  approve: (returnId: string, payload: AdminApproveReturnPayload) =>
    apiPostResponse<AdminReturnDetails>(
      ApiPath.admin.returns.approve(returnId),
      payload
    ),

  reject: (returnId: string, payload: AdminRejectReturnPayload) =>
    apiPostResponse<AdminReturnDetails>(
      ApiPath.admin.returns.reject(returnId),
      payload
    ),

  inspect: (returnId: string, payload: AdminInspectReturnPayload) =>
    apiPostResponse<AdminReturnDetails>(
      ApiPath.admin.returns.inspect(returnId),
      payload
    ),

  processRefund: (returnId: string, payload: AdminProcessRefundPayload) =>
    apiPostResponse<AdminReturnDetails>(
      ApiPath.admin.returns.processRefund(returnId),
      payload
    ),
};
