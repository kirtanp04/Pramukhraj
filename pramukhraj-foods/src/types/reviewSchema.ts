import { z } from 'zod'
import { REVIEW_SOURCE, REVIEW_STATUS } from '@/types/review'

const optionalUrl = z
  .string()
  .trim()
  .max(500, 'Source reference cannot exceed 500 characters.')
  .refine(
    (value) => value === '' || /^https?:\/\/[^\s]+$/i.test(value),
    'Source reference must be a valid HTTP or HTTPS URL.',
  )

const reviewFieldsSchema = z.object({
    customerName: z.string().trim().min(1, 'Customer name is required.').max(120, 'Customer name cannot exceed 120 characters.'),
    customerCity: z.string().trim().max(100, 'Customer city cannot exceed 100 characters.'),
    productId: z.string(),
    source: z.number().refine(
      (value) => Object.values(REVIEW_SOURCE).some((source) => source === value),
      'Review source is invalid.',
    ),
    rating: z.number().int().min(1, 'Rating must be between 1 and 5.').max(5, 'Rating must be between 1 and 5.'),
    title: z.string().trim().max(150, 'Review title cannot exceed 150 characters.'),
    comment: z.string().trim().min(1, 'Review comment is required.').max(2_000, 'Review comment cannot exceed 2,000 characters.'),
    sourceReference: optionalUrl,
    status: z.number().refine(
      (value) => Object.values(REVIEW_STATUS).some((status) => status === value),
      'Review status is invalid.',
    ),
    rejectionReason: z.string().trim().max(500, 'Rejection reason cannot exceed 500 characters.'),
    hasCustomerConsent: z.boolean().refine((value) => value, 'Customer consent is required before publishing a testimonial.'),
    isFeatured: z.boolean(),
    isActive: z.boolean(),
  })

function validatePublication(value: z.infer<typeof reviewFieldsSchema>, context: z.RefinementCtx) {
    if (value.isFeatured && (value.status !== REVIEW_STATUS.Approved || !value.isActive)) {
      context.addIssue({ code: 'custom', path: ['isFeatured'], message: 'Only an active and approved testimonial can be featured.' })
    }
}

export const createReviewSchema = reviewFieldsSchema.superRefine(validatePublication)

export const updateReviewSchema = reviewFieldsSchema.superRefine((value, context) => {
  validatePublication(value, context)
  if (value.status === REVIEW_STATUS.Rejected && !value.rejectionReason) {
    context.addIssue({ code: 'custom', path: ['rejectionReason'], message: 'A rejection reason is required when rejecting a testimonial.' })
  }
})

export type ReviewFormValues = z.infer<typeof updateReviewSchema>

export const DEFAULT_REVIEW_VALUES: ReviewFormValues = {
  customerName: '',
  customerCity: '',
  productId: '',
  source: REVIEW_SOURCE.Website,
  rating: 5,
  title: '',
  comment: '',
  sourceReference: '',
  status: REVIEW_STATUS.Approved,
  rejectionReason: '',
  hasCustomerConsent: false,
  isFeatured: false,
  isActive: true,
}
