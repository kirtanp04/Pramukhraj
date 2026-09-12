import { z } from 'zod'
import type { HomepageCmsWriteRequest } from '@/types/homepageCms'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const SUPPORTED_IMAGE_PREFIXES = [
  'data:image/png;base64,',
  'data:image/jpeg;base64,',
  'data:image/webp;base64,',
]

function isSupportedBase64Image(value: string) {
  if (value === '') return true
  const prefix = SUPPORTED_IMAGE_PREFIXES.find(item => value.toLowerCase().startsWith(item))
  if (!prefix) return false

  const payload = value.slice(prefix.length)
  if (payload.length === 0 || !/^[a-z0-9+/]*={0,2}$/i.test(payload) || payload.length % 4 !== 0) return false
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0
  return ((payload.length * 3) / 4) - padding <= MAX_IMAGE_BYTES
}

export const homepageCmsSchema = z.object({
  eyebrowBadge: z.string().trim().min(1, 'Eyebrow badge is required.').max(150, 'Eyebrow badge cannot exceed 150 characters.'),
  headline: z.string().trim().min(1, 'Headline is required.').max(250, 'Headline cannot exceed 250 characters.'),
  subtext: z.string().trim().min(1, 'Subtext is required.').max(1_000, 'Subtext cannot exceed 1,000 characters.'),
  heroImageBase64: z.string().refine(isSupportedBase64Image, 'Use a PNG, JPG, JPEG or WebP image no larger than 4 MB.'),
  heroImageAltText: z.string().trim().min(1, 'Hero image alt text is required.').max(250, 'Hero image alt text cannot exceed 250 characters.'),
  happyCustomersCount: z.string().trim().max(30, 'Happy customers count cannot exceed 30 characters.'),
  happyCustomersLabel: z.string().trim().max(60, 'Statistic 1 label cannot exceed 60 characters.'),
  productCount: z.string().trim().max(30, 'Product count cannot exceed 30 characters.'),
  productCountLabel: z.string().trim().max(60, 'Statistic 2 label cannot exceed 60 characters.'),
  averageRating: z.string().trim().max(30, 'Average rating cannot exceed 30 characters.'),
  averageRatingLabel: z.string().trim().max(60, 'Statistic 3 label cannot exceed 60 characters.'),
  showShopByCategory: z.boolean(),
  showFeaturedProducts: z.boolean(),
  showTrendingProducts: z.boolean(),
  showBestSellerProducts: z.boolean(),
  showNewArrivalProducts: z.boolean(),
  showCustomerTestimonials: z.boolean(),
  showFaqSection: z.boolean(),
}) satisfies z.ZodType<HomepageCmsWriteRequest>

export const DEFAULT_HOMEPAGE_CMS_VALUES: HomepageCmsWriteRequest = {
  eyebrowBadge: 'Since 1997 · Gujarat',
  headline: 'Traditional taste, modern shopping.',
  subtext: 'Hand-rolled papad, stone-ground masala and small-batch sweets — sourced from home kitchens across Gujarat and shipped to your door.',
  heroImageBase64: '',
  heroImageAltText: 'Pramukhraj Foods traditional namkeen, farsan and papad products',
  happyCustomersCount: '',
  happyCustomersLabel: '',
  productCount: '',
  productCountLabel: '',
  averageRating: '',
  averageRatingLabel: '',
  showShopByCategory: true,
  showFeaturedProducts: true,
  showTrendingProducts: true,
  showBestSellerProducts: true,
  showNewArrivalProducts: true,
  showCustomerTestimonials: true,
  showFaqSection: true,
}
