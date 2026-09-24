import { ApiPath } from "@/constants/apiPaths";
import { apiClient, apiGet, apiPostResponse } from "@/lib/apiClient";
import type {
  AdminReturnFilterParams,
  AdminReturnListPage,
  AdminReturnDetails,
  AdminApproveReturnPayload,
  AdminRejectReturnPayload,
  AdminInspectReturnPayload,
  AdminProcessRefundPayload,
  ScheduleReversePickupRequest,
  UpdateReverseTrackingRequest,
  AdminFulfillReplacementPayload,
  ReverseCourierOption,
  BookReversePickupPayload,
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

  schedulePickup: (returnId: string, payload: ScheduleReversePickupRequest) =>
    apiPostResponse<AdminReturnDetails>(
      ApiPath.admin.returns.schedulePickup(returnId),
      payload
    ),

  getCouriers: (returnId: string) =>
    apiGet<ReverseCourierOption[]>(ApiPath.admin.returns.couriers(returnId)),

  bookPickup: (returnId: string, payload: BookReversePickupPayload) =>
    apiPostResponse<AdminReturnDetails>(
      ApiPath.admin.returns.bookPickup(returnId),
      payload
    ),

  updateTracking: (returnId: string, payload: UpdateReverseTrackingRequest) =>

    apiPostResponse<AdminReturnDetails>(
      ApiPath.admin.returns.updateTracking(returnId),
      payload
    ),

  fulfillReplacement: (
    returnId: string,
    payload: AdminFulfillReplacementPayload
  ) =>
    apiPostResponse<AdminReturnDetails>(
      ApiPath.admin.returns.fulfillReplacement(returnId),
      payload
    ),

  exportCsv: async (filter?: AdminReturnFilterParams): Promise<Blob> => {
    const url = ApiPath.admin.returns.export(filter);
    const response = await apiClient.get(url, { responseType: "blob" });
    return response.data as Blob;
  },
};
