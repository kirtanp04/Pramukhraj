import { z } from "zod";
export const couponSchema = z.object({ couponCode: z.string().trim().min(1, "Enter a coupon code.").max(50).regex(/^[A-Za-z0-9_-]+$/, "Enter a valid coupon code.") });
export type CouponValues = z.infer<typeof couponSchema>;
