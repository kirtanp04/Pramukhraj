import { z } from 'zod'

export const PRODUCT_CATEGORY_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const PRODUCT_CATEGORY_IMAGE_MAX_BYTES = 2 * 1024 * 1024

export const productCategoryImageFileSchema = z
  .custom<File>(
    (value) => typeof File !== 'undefined' && value instanceof File,
    'Please choose an image file.',
  )
  .refine(
    (file) => PRODUCT_CATEGORY_IMAGE_TYPES.some((type) => type === file.type),
    'Only JPG, JPEG, PNG and WEBP images are allowed.',
  )
  .refine(
    (file) => file.size <= PRODUCT_CATEGORY_IMAGE_MAX_BYTES,
    'Image must be 2 MB or smaller.',
  )

export const productCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required.')
    .max(255, 'Category name cannot exceed 255 characters.'),
  description: z
    .string()
    .trim()
    .max(1_000, 'Description cannot exceed 1,000 characters.'),
  imageUrl: z
    .string()
    .trim()
    .min(1, 'Category image is required.')
    .refine(
      (value) =>
        value.startsWith('data:image/jpeg') ||
        value.startsWith('data:image/png') ||
        value.startsWith('data:image/webp') ||
        value.startsWith('http://') ||
        value.startsWith('https://'),
      'Please choose a valid JPG, PNG or WEBP image.',
    ),
  displayOrder: z
    .number({ error: 'Display order must be a number.' })
    .int('Display order must be a whole number.')
    .min(0, 'Display order cannot be negative.'),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
})

export type AddProductCategoryRequest = z.infer<typeof productCategorySchema>

export const DEFAULT_PRODUCT_CATEGORY_VALUES: AddProductCategoryRequest = {
  name: '',
  description: '',
  imageUrl: '',
  displayOrder: 0,
  isFeatured: false,
  isActive: true,
}
