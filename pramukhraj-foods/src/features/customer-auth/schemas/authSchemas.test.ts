import { describe, expect, it } from "vitest";
import { mobileSchema, otpSchema, profileSchema } from "./authSchemas";

describe("customer auth schemas", () => {
  it("normalizes an Indian local mobile number to E.164", () => {
    expect(mobileSchema.parse({ mobileNumber: "98765 43210" }).mobileNumber).toBe("+919876543210");
  });

  it("rejects malformed mobile numbers and OTP codes", () => {
    expect(mobileSchema.safeParse({ mobileNumber: "123" }).success).toBe(false);
    expect(otpSchema.safeParse({ code: "12345a" }).success).toBe(false);
  });

  it("requires valid basic profile identity fields", () => {
    expect(profileSchema.safeParse({ fullName: "A", email: "bad", marketingConsent: false }).success).toBe(false);
    expect(profileSchema.safeParse({ fullName: "Kirtan Patel", email: "kirtan@example.com", marketingConsent: false }).success).toBe(true);
  });
});
