import { describe, expect, it } from "vitest";
import { ApiPath } from "@/constants/apiPaths";

describe("Customer Orders ApiPath generation", () => {
  it("builds correct list query without parameters", () => {
    expect(ApiPath.customer.orders.list()).toBe("customer/orders");
  });

  it("builds query with pagination parameters", () => {
    expect(ApiPath.customer.orders.list({ page: 2, pageSize: 20 })).toBe(
      "customer/orders?page=2&pageSize=20"
    );
  });

  it("builds query with status filter, ignoring 'all'", () => {
    expect(ApiPath.customer.orders.list({ page: 1, pageSize: 10, status: "all" })).toBe(
      "customer/orders?page=1&pageSize=10"
    );
    expect(ApiPath.customer.orders.list({ page: 1, pageSize: 10, status: "Confirmed" })).toBe(
      "customer/orders?page=1&pageSize=10&status=Confirmed"
    );
  });

  it("builds correct detail and tracking paths", () => {
    const orderId = "c8f3b482-963d-4c3e-908d-2947e9ffb123";
    expect(ApiPath.customer.orders.detail(orderId)).toBe(
      `customer/orders/${orderId}`
    );
    expect(ApiPath.customer.orders.tracking(orderId)).toBe(
      `customer/orders/${orderId}/tracking`
    );
  });
});

