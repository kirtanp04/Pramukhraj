import { z } from "zod";

export const addressSchema = z.object({
  recipientName: z.string().trim().min(2, "Recipient name is required.").max(120),
  mobileNumber: z.string().trim().regex(/^\+91[6-9]\d{9}$/, "Use an Indian mobile number such as +919876543210."),
  email: z.string().trim().email("Enter a valid email.").max(256).or(z.literal("")),
  addressLine1: z.string().trim().min(5, "Address is required.").max(250),
  addressLine2: z.string().trim().max(250),
  landmark: z.string().trim().max(150),
  city: z.string().trim().min(2, "City is required.").max(100),
  state: z.string().trim().min(2, "State is required.").max(100),
  postalCode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit Indian PIN code."),
  country: z.literal("India"),
  addressType: z.enum(["Home", "Work", "Other"]),
  isDefaultShipping: z.boolean(),
  isDefaultBilling: z.boolean(),
  concurrencyStamp: z.string().optional(),
});
export type AddressFormValues = z.infer<typeof addressSchema>;
