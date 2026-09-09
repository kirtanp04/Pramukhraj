export const REVIEW_SOURCE = {
  Website: 1,
  OfflineStore: 2,
  WhatsApp: 3,
  Instagram: 4,
  Google: 5,
  Distributor: 6,
} as const

export const REVIEW_STATUS = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
} as const

export const REVIEW_TYPE = {
  ProductReview: 1,
  BrandTestimonial: 2,
} as const

export type ReviewSource = (typeof REVIEW_SOURCE)[keyof typeof REVIEW_SOURCE]
export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS]
export type ReviewType = (typeof REVIEW_TYPE)[keyof typeof REVIEW_TYPE]

export interface AdminReviewListItem {
  id: string
  customerName: string
  customerCity: string
  productName: string
  reviewType: ReviewType
  source: ReviewSource
  status: ReviewStatus
  rating: number
  title: string
  commentPreview: string
  isVerifiedPurchase: boolean
  isFeatured: boolean
  isActive: boolean
  createdOn: string
}

export interface CreateAdminReviewRequest {
  customerName: string
  customerCity: string | null
  productId: string | null
  source: ReviewSource
  rating: number
  title: string | null
  comment: string
  status: ReviewStatus
  hasCustomerConsent: boolean
  isFeatured: boolean
  isActive: boolean
}

export interface UpdateAdminReviewRequest extends CreateAdminReviewRequest {
  sourceReference: string | null
  rejectionReason: string | null
}

export interface AdminReviewDetailsResponse extends UpdateAdminReviewRequest {
  id: string
  productName: string | null
  reviewType: ReviewType
}

export const REVIEW_SOURCE_LABELS: Record<ReviewSource, string> = {
  1: 'Website',
  2: 'Offline store',
  3: 'WhatsApp',
  4: 'Instagram',
  5: 'Google',
  6: 'Distributor',
}

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  1: 'Pending',
  2: 'Approved',
  3: 'Rejected',
}

export const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  1: 'Product review',
  2: 'Brand testimonial',
}
