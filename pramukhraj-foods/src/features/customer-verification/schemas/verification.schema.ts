import { z } from "zod";

export const verificationCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

export const verificationEmailSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address.").max(256),
});

export type VerificationCodeValues = z.infer<typeof verificationCodeSchema>;
export type VerificationEmailValues = z.infer<typeof verificationEmailSchema>;
