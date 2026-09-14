import { z } from "zod";

function normalizeMobile(value: string) {
  const compact = value.replace(/[\s()-]/g, "");
  if (/^\d{10}$/.test(compact)) return `+91${compact}`;
  return compact.startsWith("+") ? compact : `+${compact}`;
}

export const mobileSchema = z.object({
  mobileNumber: z.string().trim().min(1, "Enter your mobile number")
    .transform(normalizeMobile)
    .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Use a valid mobile number with country code")),
});

export const otpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(120, "Name is too long"),
  email: z.email("Enter a valid email address").max(256),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().refine(value => !value || /^[A-Za-z0-9 -]{3,10}$/.test(value), "Enter a valid postal code").optional(),
  marketingConsent: z.boolean(),
});

export type MobileFormValues = z.input<typeof mobileSchema>;
export type OtpFormValues = z.input<typeof otpSchema>;
export type ProfileFormValues = z.input<typeof profileSchema>;
