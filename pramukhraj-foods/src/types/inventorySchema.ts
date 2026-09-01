import { z } from 'zod'

export const inventoryUpdateSchema = z.object({
  stock: z
    .number({ error: 'Stock quantity is required' })
    .int('Stock quantity must be a whole number')
    .min(0, 'Stock quantity cannot be negative')
    .max(2_147_483_647, 'Stock quantity is too large'),
  isActive: z.boolean(),
})

export type InventoryUpdateFormValues = z.infer<typeof inventoryUpdateSchema>
