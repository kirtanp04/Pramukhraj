import { describe, expect, it } from "vitest";
import { ApiPath } from "@/constants/apiPaths";
import {
  ReturnStatus,
  ReturnStatusLabels,
  ReturnStatusBadgeVariants,
  ReturnReason,
  ReturnReasonLabels,
  ReturnResolution,
  ReturnResolutionLabels,
} from "../types";

describe("Customer Returns ApiPath generation", () => {
  const dummyOrderId = "e578c734-7a91-4cf1-8ee4-2a62372f5341";
  const dummyReturnId = "8a213340-9759-450a-9d92-2df28362ee8e";

  it("builds correct return eligibility path", () => {
    expect(ApiPath.customer.returns.eligibility(dummyOrderId)).toBe(
      `customer/orders/${dummyOrderId}/return-eligibility`
    );
  });

  it("builds correct create return request path", () => {
    expect(ApiPath.customer.returns.create(dummyOrderId)).toBe(
      `customer/orders/${dummyOrderId}/returns`
    );
  });

  it("builds correct customer returns list path without params", () => {
    expect(ApiPath.customer.returns.list()).toBe("customer/returns");
  });

  it("builds correct customer returns list path with pagination", () => {
    expect(ApiPath.customer.returns.list({ page: 2, pageSize: 15 })).toBe(
      "customer/returns?page=2&pageSize=15"
    );
  });

  it("builds correct return detail and cancel paths", () => {
    expect(ApiPath.customer.returns.detail(dummyReturnId)).toBe(
      `customer/returns/${dummyReturnId}`
    );
    expect(ApiPath.customer.returns.cancel(dummyReturnId)).toBe(
      `customer/returns/${dummyReturnId}/cancel`
    );
  });
});

describe("Return Enums and Display Mappings", () => {
  it("provides human-readable labels for all ReturnStatus values", () => {
    expect(ReturnStatusLabels[ReturnStatus.Requested]).toBe("Requested");
    expect(ReturnStatusLabels[ReturnStatus.Approved]).toBe("Approved");
    expect(ReturnStatusLabels[ReturnStatus.InspectionPassed]).toBe("QC Passed");
    expect(ReturnStatusLabels[ReturnStatus.RefundCompleted]).toBe("Refund Completed");
    expect(ReturnStatusLabels[ReturnStatus.Rejected]).toBe("Rejected");
    expect(ReturnStatusLabels[ReturnStatus.Cancelled]).toBe("Cancelled");
  });

  it("assigns valid badge variants to all ReturnStatus values", () => {
    expect(ReturnStatusBadgeVariants[ReturnStatus.Requested]).toBe("turmeric");
    expect(ReturnStatusBadgeVariants[ReturnStatus.Approved]).toBe("teal");
    expect(ReturnStatusBadgeVariants[ReturnStatus.InspectionPassed]).toBe("success");
    expect(ReturnStatusBadgeVariants[ReturnStatus.RefundCompleted]).toBe("success");
    expect(ReturnStatusBadgeVariants[ReturnStatus.Rejected]).toBe("oxblood");
  });

  it("provides labels for all ReturnReason and ReturnResolution values", () => {
    expect(ReturnReasonLabels[ReturnReason.DamagedInTransit]).toBe("Damaged in transit");
    expect(ReturnReasonLabels[ReturnReason.DefectiveOrExpired]).toBe("Defective or expired product");
    expect(ReturnReasonLabels[ReturnReason.WrongItemReceived]).toBe("Wrong item received");
    expect(ReturnReasonLabels[ReturnReason.QualityMismatch]).toBe("Quality not as expected");
    expect(ReturnReasonLabels[ReturnReason.MissingItem]).toBe("Missing item from shipment");
    expect(ReturnReasonLabels[ReturnReason.LateDelivery]).toBe("Arrived too late");
    expect(ReturnReasonLabels[ReturnReason.OrderedByMistake]).toBe("Ordered by mistake");
    expect(ReturnReasonLabels[ReturnReason.PackageTampered]).toBe("Package opened or tampered");
    expect(ReturnReasonLabels[ReturnReason.TasteNotAsExpected]).toBe("Taste not as expected");
    expect(ReturnResolutionLabels[ReturnResolution.RefundToSource]).toBe(
      "Refund to original payment source"
    );
  });
});

