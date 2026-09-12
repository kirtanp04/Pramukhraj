export const FAQ_CATEGORY = {
  General: 1,
  Products: 2,
  Ordering: 3,
  Payments: 4,
  Shipping: 5,
  ReturnsAndRefunds: 6,
  CustomerAccount: 7,
  CouponsAndOffers: 8,
} as const

export type FaqCategory = (typeof FAQ_CATEGORY)[keyof typeof FAQ_CATEGORY]

export const FAQ_CATEGORY_LABELS: Record<FaqCategory, string> = {
  1: 'General',
  2: 'Products',
  3: 'Ordering',
  4: 'Payments',
  5: 'Shipping',
  6: 'Returns & refunds',
  7: 'Customer account',
  8: 'Coupons & offers',
}

export interface FaqWriteRequest {
  category: FaqCategory
  question: string
  answer: string
  displayOrder: number
  isFeatured: boolean
  isActive: boolean
}

export interface FaqDetailsResponse extends FaqWriteRequest {
  id: string
  createdOn: string
  updatedOn: string
}

export interface FaqListItem {
  id: string
  category: FaqCategory
  question: string
  answerPreview: string
  displayOrder: number
  isFeatured: boolean
  isActive: boolean
  updatedOn: string
}

export interface FaqListPageResponse {
  items: FaqListItem[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface CustomerFaq {
  id: string
  question: string
  answer: string
}
