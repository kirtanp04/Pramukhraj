import { describe, expect, it } from "vitest";
import { couponSchema } from "./checkout.schema";

describe("checkout coupon schema", () => {
  it("accepts safe coupon characters", () => expect(couponSchema.safeParse({ couponCode: "WELCOME_10" }).success).toBe(true));
  it("rejects script-like coupon input", () => expect(couponSchema.safeParse({ couponCode: "<script>" }).success).toBe(false));
});
