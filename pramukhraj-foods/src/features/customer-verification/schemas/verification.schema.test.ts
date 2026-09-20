import { describe, expect, it } from "vitest";
import { verificationCodeSchema, verificationEmailSchema } from "./verification.schema";

describe("customer verification schemas", () => {
  it("accepts only a six-digit verification code", () => {
    expect(verificationCodeSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(verificationCodeSchema.safeParse({ code: "12345a" }).success).toBe(false);
  });
  it("rejects malformed email addresses", () => {
    expect(verificationEmailSchema.safeParse({ email: "customer@example.com" }).success).toBe(true);
    expect(verificationEmailSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
