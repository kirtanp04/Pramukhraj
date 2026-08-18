// ─── Product Image ────────────────────────────────────────────────────────────

export class ProductImage {
  id: string = ''
  productId: string = ''
  imageUrl: string = ''
  altText: string | null = null
  isPrimary: boolean = false
  displayOrder: number = 0
}

// ─── Product Variant ──────────────────────────────────────────────────────────

export class ProductVariant {
  id: string = ''
  productId: string = ''
  name: string = ''
  sku: string = ''
  price: number = 0       // *required
  mrp: number = 0         // *required
  stockQuantity: number = 0 // *required
  weight: number = 0
  weightUnit: string = 'gm'
  isDefault: boolean = false
  isActive: boolean = true
}

// ─── Product Tag ──────────────────────────────────────────────────────────────

export class ProductTag {
  id: string = ''
  productId: string = ''
  name: string = ''
}

// ─── Product ──────────────────────────────────────────────────────────────────

export class Product {
  id: string = ''
  categoryId: string = ''           // select field  *required
  name: string = ''                 // *required
  shortDescription: string = ''
  description: string = ''
  brand: string = 'Pramukhraj'      // *required
  isFeatured: boolean = false
  isBestSeller: boolean = false
  isTrending: boolean = false
  isNewArrival: boolean = false
  isActive: boolean = true
  weight: number = 0                // *required (> 0)
  weightUnit: string = 'gm'
  countryOfOrigin: string = 'India' // *required
  isVegetarian: boolean = true
  shelfLife: string = ''            // empty = lifetime good
  storageInstruction: string = ''
  ingredients: string = ''
  nutritionalInformation: string = ''
  barcode: string | null = null
  createdOn: string = ''
  updatedOn: string = ''
  images: ProductImage[] = []       // *required, only one isPrimary
  variants: ProductVariant[] = []
  tags: ProductTag[] = []

  static calculatedDiscountPercentage(mrp: number, price: number): number {
    if (mrp <= 0 || price >= mrp) return 0
    return Number((((mrp - price) / mrp) * 100).toFixed(2))
  }
}

// ─── Weight unit options ──────────────────────────────────────────────────────

export const WEIGHT_UNITS = ['gm', 'kg', 'ml', 'L', 'piece'] as const
export type WeightUnit = (typeof WEIGHT_UNITS)[number]

// ─── Step definitions ─────────────────────────────────────────────────────────

export interface ProductFormStep {
  id: number
  label: string
  description: string
}

export const PRODUCT_FORM_STEPS: ProductFormStep[] = [
  { id: 1, label: 'Basic Info', description: 'Name, category, brand & core flags' },
  { id: 2, label: 'Details', description: 'Weight, origin, ingredients & nutrition' },
  { id: 3, label: 'Variants', description: 'Pricing, SKU & stock per variant' },
  { id: 4, label: 'Tags', description: 'Searchable labels' },
  { id: 5, label: 'Images', description: 'Gallery & primary image' },
  { id: 6, label: 'Review', description: 'Confirm everything before saving' },
]