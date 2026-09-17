import { describe, expect, it } from "vitest";
import { addressSchema } from "./address.schema";

const validAddress = { recipientName: "Kirtan Patel", mobileNumber: "+919876543210", email: "", addressLine1: "Main Road", addressLine2: "", landmark: "", city: "Anand", state: "Gujarat", postalCode: "388001", country: "India", addressType: "Home", isDefaultShipping: true, isDefaultBilling: true };

describe("address schema", () => {
  it("accepts a valid Indian delivery address", () => expect(addressSchema.safeParse(validAddress).success).toBe(true));
  it("rejects non-Indian phone and PIN formats", () => {
    const result = addressSchema.safeParse({ ...validAddress, mobileNumber: "123", postalCode: "ABC" });
    expect(result.success).toBe(false);
  });
});
