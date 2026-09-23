export const ReturnStatus = {
  Requested: 1,
  Approved: 2,
  Rejected: 3,
  PickupScheduled: 4,
  PickedUp: 5,
  InTransit: 6,
  DeliveredToWarehouse: 7,
  InspectionPassed: 8,
  InspectionFailed: 9,
  RefundInitiated: 10,
  RefundCompleted: 11,
  Cancelled: 12,
  Closed: 13,
} as const;
export type ReturnStatus = (typeof ReturnStatus)[keyof typeof ReturnStatus];

export const ReturnReason = {
  DamagedInTransit: 1,
  DefectiveOrExpired: 2,
  WrongItemReceived: 3,
  QualityMismatch: 4,
  MissingItem: 5,
  Other: 6,
} as const;
export type ReturnReason = (typeof ReturnReason)[keyof typeof ReturnReason];

export const ReturnResolution = {
  RefundToSource: 1,
  Replacement: 2,
} as const;
export type ReturnResolution = (typeof ReturnResolution)[keyof typeof ReturnResolution];

export const InspectionOutcome = {
  Pending: 1,
  Passed: 2,
  Failed: 3,
} as const;
export type InspectionOutcome = (typeof InspectionOutcome)[keyof typeof InspectionOutcome];

export const RefundStatus = {
  Pending: 1,
  Processed: 2,
  Failed: 3,
} as const;
export type RefundStatus = (typeof RefundStatus)[keyof typeof RefundStatus];

export const ReturnStatusLabels: Record<ReturnStatus, string> = {
  [ReturnStatus.Requested]: "Requested",
  [ReturnStatus.Approved]: "Approved",
  [ReturnStatus.Rejected]: "Rejected",
  [ReturnStatus.PickupScheduled]: "Pickup Scheduled",
  [ReturnStatus.PickedUp]: "Picked Up",
  [ReturnStatus.InTransit]: "In Transit",
  [ReturnStatus.DeliveredToWarehouse]: "Delivered to Warehouse",
  [ReturnStatus.InspectionPassed]: "QC Passed",
  [ReturnStatus.InspectionFailed]: "QC Failed",
  [ReturnStatus.RefundInitiated]: "Refund Initiated",
  [ReturnStatus.RefundCompleted]: "Refund Completed",
  [ReturnStatus.Cancelled]: "Cancelled",
  [ReturnStatus.Closed]: "Closed",
};

export const ReturnStatusBadgeVariants: Record<
  ReturnStatus,
  "turmeric" | "teal" | "soft" | "oxblood" | "success" | "outline"
> = {
  [ReturnStatus.Requested]: "turmeric",
  [ReturnStatus.Approved]: "teal",
  [ReturnStatus.Rejected]: "oxblood",
  [ReturnStatus.PickupScheduled]: "teal",
  [ReturnStatus.PickedUp]: "teal",
  [ReturnStatus.InTransit]: "teal",
  [ReturnStatus.DeliveredToWarehouse]: "teal",
  [ReturnStatus.InspectionPassed]: "success",
  [ReturnStatus.InspectionFailed]: "oxblood",
  [ReturnStatus.RefundInitiated]: "turmeric",
  [ReturnStatus.RefundCompleted]: "success",
  [ReturnStatus.Cancelled]: "soft",
  [ReturnStatus.Closed]: "soft",
};

export const ReturnReasonLabels: Record<ReturnReason, string> = {
  [ReturnReason.DamagedInTransit]: "Damaged in transit",
  [ReturnReason.DefectiveOrExpired]: "Defective or expired product",
  [ReturnReason.WrongItemReceived]: "Wrong item received",
  [ReturnReason.QualityMismatch]: "Quality not as expected",
  [ReturnReason.MissingItem]: "Missing item from shipment",
  [ReturnReason.Other]: "Other issues",
};

export const ReturnResolutionLabels: Record<ReturnResolution, string> = {
  [ReturnResolution.RefundToSource]: "Refund to original payment source",
  [ReturnResolution.Replacement]: "Replacement with new unit",
};

export const InspectionOutcomeLabels: Record<InspectionOutcome, string> = {
  [InspectionOutcome.Pending]: "Pending Inspection",
  [InspectionOutcome.Passed]: "Passed",
  [InspectionOutcome.Failed]: "Failed",
};

// Eligibility DTOs
export interface EligibleOrderItem {
  orderItemId: string;
  productVariantId: string;
  productName: string;
  variantName: string;
  purchasedQuantity: number;
  alreadyReturnedQuantity: number;
  returnableQuantity: number;
  unitPrice: number;
  refundPerItem: number;
  isReturnable?: boolean;
  nonReturnableReason?: string | null;
}

export interface ReturnEligibility {
  isEligible: boolean;
  returnWindowDays: number;
  deliveredOn: string | null;
  returnWindowExpiresOn: string | null;
  ineligibilityReason: string | null;
  items: EligibleOrderItem[];
}

// Creation Request DTOs
export interface CreateReturnItemInput {
  orderItemId: string;
  quantity: number;
}

export interface CreateReturnMediaInput {
  url: string;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
}

export interface CreateReturnRequest {
  items: CreateReturnItemInput[];
  reason: ReturnReason;
  resolution: ReturnResolution;
  customerComments: string;
  media?: CreateReturnMediaInput[];
}

// Return Item Detail
export interface CustomerReturnItemDetail {
  id: string;
  orderItemId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  inspectionStatus: InspectionOutcome;
}

export interface CustomerReturnMedia {
  id: string;
  url: string;
  fileName: string;
}

export interface CustomerReturnTimeline {
  status: ReturnStatus;
  note: string | null;
  createdOn: string;
}

export interface CustomerRefundDetail {
  providerRefundId: string | null;
  amount: number;
  status: RefundStatus;
  settledOn: string | null;
}

// Customer Return Summary (Listing item)
export interface CustomerReturnSummary {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  status: ReturnStatus;
  reason: ReturnReason;
  totalItemCount: number;
  netRefundAmount: number;
  createdOn: string;
  completedOn: string | null;
}

// Customer Return Details
export interface CustomerReturnDetails {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  status: ReturnStatus;
  reason: ReturnReason;
  resolution: ReturnResolution;
  customerComments: string;
  rejectionReason: string | null;
  totalRefundAmount: number;
  reverseShippingDeduction: number;
  netRefundAmount: number;
  createdOn: string;
  updatedOn: string;
  approvedOn: string | null;
  completedOn: string | null;
  items: CustomerReturnItemDetail[];
  media: CustomerReturnMedia[];
  timeline: CustomerReturnTimeline[];
  refund: CustomerRefundDetail | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  pickupScheduledDate?: string | null;
  pickedUpOn?: string | null;
  deliveredToWarehouseOn?: string | null;
  receivedOn?: string | null;
  inspectedOn?: string | null;
}

// Customer List Page Response
export interface CustomerReturnListPage {
  returns: CustomerReturnSummary[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

