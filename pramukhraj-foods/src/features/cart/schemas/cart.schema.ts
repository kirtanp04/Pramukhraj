import { z } from 'zod'

export const cartGuidSchema = z.string().uuid()
export const guestCartItemSchema = z.object({ productVariantId: cartGuidSchema, quantity: z.number().int().min(1).max(20) })
export const guestCartSchema = z.object({ version: z.literal(1), items: z.array(guestCartItemSchema).max(50), updatedAt: z.string().datetime() })
