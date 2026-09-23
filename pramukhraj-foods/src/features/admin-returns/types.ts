import type {
  ReturnStatus,
  ReturnReason,
  ReturnResolution,
  InspectionOutcome,
  RefundStatus,
  CustomerReturnMedia,
} from "../returns/types";

export interface AdminReturnFilterParams {
  status?: number | string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminReturnSummary {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: ReturnStatus;
  reason: ReturnReason;
  resolution: ReturnResolution;
  totalItemCount: number;
  totalRefundAmount: number;
  reverseShippingDeduction: number;
  netRefundAmount: number;
  createdOn: string;
  updatedOn: string;
}

export interface AdminReturnItemDetail {
  id: string;
  orderItemId: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  inspectionStatus: InspectionOutcome;
  restockInventory: boolean;
}

export interface AdminReturnTimeline {
  id: string;
  status: ReturnStatus;
  note: string | null;
  actorAdminId: string | null;
  actorAdminName: string | null;
  createdOn: string;
}

export interface AdminRefundDetail {
  id: string;
  idempotencyKey: string;
  providerRefundId: string | null;
  amount: number;
  amountPaise: number;
  currency: string;
  status: RefundStatus;
  refundSpeed: string;
  failureReason: string | null;
  createdOn: string;
  settledOn: string | null;
}

export interface AdminReturnDetails {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: ReturnStatus;
  reason: ReturnReason;
  resolution: ReturnResolution;
  customerComments: string;
  adminNotes: string | null;
  rejectionReason: string | null;
  totalRefundAmount: number;
  reverseShippingDeduction: number;
  netRefundAmount: number;
  createdOn: string;
  updatedOn: string;
  approvedOn: string | null;
  receivedOn: string | null;
  inspectedOn: string | null;
  completedOn: string | null;
  concurrencyStamp: string;
  items: AdminReturnItemDetail[];
  media: CustomerReturnMedia[];
  timeline: AdminReturnTimeline[];
  refund: AdminRefundDetail | null;
}

export interface AdminReturnStatusCounts {
  total: number;
  requested: number;
  approved: number;
  rejected: number;
  inTransit: number;
  deliveredToWarehouse: number;
  inspectionPassed: number;
  inspectionFailed: number;
  refundCompleted: number;
  cancelled: number;
}

export interface AdminReturnListPage {
  returns: AdminReturnSummary[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  statusCounts: AdminReturnStatusCounts;
}

export interface AdminApproveReturnPayload {
  reverseShippingDeduction?: number;
  adminNotes?: string;
}

export interface AdminRejectReturnPayload {
  rejectionReason: string;
}

export interface AdminItemInspectionInput {
  returnItemId: string;
  outcome: InspectionOutcome;
  restockInventory: boolean;
}

export interface AdminInspectReturnPayload {
  items: AdminItemInspectionInput[];
  inspectionNotes?: string;
}

export interface AdminProcessRefundPayload {
  refundSpeed?: "normal" | "optimum" | string;
}

