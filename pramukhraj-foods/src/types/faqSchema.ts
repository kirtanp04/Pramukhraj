import { z } from 'zod'
import { FAQ_CATEGORY, type FaqWriteRequest } from '@/types/faq'

export const faqSchema = z.object({
  category: z.union([
    z.literal(FAQ_CATEGORY.General),
    z.literal(FAQ_CATEGORY.Products),
    z.literal(FAQ_CATEGORY.Ordering),
    z.literal(FAQ_CATEGORY.Payments),
    z.literal(FAQ_CATEGORY.Shipping),
    z.literal(FAQ_CATEGORY.ReturnsAndRefunds),
    z.literal(FAQ_CATEGORY.CustomerAccount),
    z.literal(FAQ_CATEGORY.CouponsAndOffers),
  ], { error: 'FAQ category is invalid.' }),
  question: z.string().trim().min(1, 'Question is required.').max(500, 'Question cannot exceed 500 characters.'),
  answer: z.string().trim().min(1, 'Answer is required.').max(5_000, 'Answer cannot exceed 5,000 characters.'),
  displayOrder: z.number({ error: 'Display order must be a number.' }).int('Display order must be a whole number.').min(0, 'Display order cannot be negative.'),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
}) satisfies z.ZodType<FaqWriteRequest>

export const DEFAULT_FAQ_VALUES: FaqWriteRequest = {
  category: FAQ_CATEGORY.General,
  question: '',
  answer: '',
  displayOrder: 0,
  isFeatured: false,
  isActive: true,
}
