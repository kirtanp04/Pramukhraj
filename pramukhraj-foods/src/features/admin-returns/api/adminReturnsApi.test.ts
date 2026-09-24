import { describe, expect, it } from "vitest";
import { ApiPath } from "@/constants/apiPaths";
import { ReturnStatus } from "@/features/returns/types";

describe("Admin Returns ApiPath generation", () => {
  const dummyReturnId = "2513f502-0e9e-49b8-b114-1e0388d752aa";

  it("builds correct admin returns list path without params", () => {
    expect(ApiPath.admin.returns.list()).toBe("admin/returns");
  });

  it("builds query with pagination, search, and status filters", () => {
    const url = ApiPath.admin.returns.list({
      page: 1,
      pageSize: 20,
      searchQuery: "RMA-2026",
      status: ReturnStatus.Requested,
    });
    expect(url).toContain("admin/returns?");
    expect(url).toContain("page=1");
    expect(url).toContain("pageSize=20");
    expect(url).toContain("searchQuery=RMA-2026");
    expect(url).toContain(`status=${ReturnStatus.Requested}`);
  });

  it("omits status when filter is 'ALL'", () => {
    const url = ApiPath.admin.returns.list({
      status: "ALL",
      page: 1,
    });
    expect(url).not.toContain("status=ALL");
    expect(url).toBe("admin/returns?page=1");
  });

  it("builds correct action endpoint paths", () => {
    expect(ApiPath.admin.returns.details(dummyReturnId)).toBe(
      `admin/returns/${dummyReturnId}`
    );
    expect(ApiPath.admin.returns.approve(dummyReturnId)).toBe(
      `admin/returns/${dummyReturnId}/approve`
    );
    expect(ApiPath.admin.returns.reject(dummyReturnId)).toBe(
      `admin/returns/${dummyReturnId}/reject`
    );
    expect(ApiPath.admin.returns.inspect(dummyReturnId)).toBe(
      `admin/returns/${dummyReturnId}/inspect`
    );
    expect(ApiPath.admin.returns.processRefund(dummyReturnId)).toBe(
      `admin/returns/${dummyReturnId}/process-refund`
    );
    expect(ApiPath.admin.returns.schedulePickup(dummyReturnId)).toBe(
      `admin/returns/${dummyReturnId}/schedule-pickup`
    );
    expect(ApiPath.admin.returns.couriers(dummyReturnId)).toBe(
      `admin/returns/${dummyReturnId}/couriers`
    );
    expect(ApiPath.admin.returns.bookPickup(dummyReturnId)).toBe(
      `admin/returns/${dummyReturnId}/book-pickup`
    );
    expect(ApiPath.admin.returns.updateTracking(dummyReturnId)).toBe(
      `admin/returns/${dummyReturnId}/update-tracking`
    );
    expect(ApiPath.admin.returns.fulfillReplacement(dummyReturnId)).toBe(
      `admin/returns/${dummyReturnId}/fulfill-replacement`
    );

  });

  it("builds correct export csv endpoint path with filters", () => {
    const url = ApiPath.admin.returns.export({
      status: ReturnStatus.RefundCompleted,
      searchQuery: "ORD-99",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    });
    expect(url).toContain("admin/returns/export?");
    expect(url).toContain(`status=${ReturnStatus.RefundCompleted}`);
    expect(url).toContain("searchQuery=ORD-99");
    expect(url).toContain("startDate=2026-09-01");
    expect(url).toContain("endDate=2026-09-30");
  });
});

