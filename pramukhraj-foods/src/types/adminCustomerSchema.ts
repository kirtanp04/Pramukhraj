import { z } from 'zod'

const optionalText = (maximum: number, message: string) => z.string().trim().max(maximum, message)

export const adminCustomerPatchSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.').max(120, 'Full name cannot exceed 120 characters.'),
  email: optionalText(256, 'Email cannot exceed 256 characters.').refine(
    value => value === '' || z.email().safeParse(value).success,
    'Enter a valid email address.',
  ),
  city: optionalText(100, 'City cannot exceed 100 characters.'),
  state: optionalText(100, 'State cannot exceed 100 characters.'),
  postalCode: optionalText(10, 'Postal code cannot exceed 10 characters.').refine(
    value => value === '' || /^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/.test(value),
    'Enter a valid postal code.',
  ),
  marketingConsent: z.boolean(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
  blockReason: optionalText(500, 'Block reason cannot exceed 500 characters.'),
  concurrencyStamp: z.string().length(32),
}).superRefine((value, context) => {
  if (value.status === 'BLOCKED' && value.blockReason.length === 0) {
    context.addIssue({ code: 'custom', path: ['blockReason'], message: 'Block reason is required.' })
  }
})

export type AdminCustomerPatchValues = z.infer<typeof adminCustomerPatchSchema>
