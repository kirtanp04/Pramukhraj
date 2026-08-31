import { z } from "zod";

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

export const productImageSchema = z.object({
  id: z.string(),
  // Accepts base64 data URIs (new uploads) OR regular https URLs (existing
  // images returned from the server in edit mode). The .min(1) ensures the
  // field is never blank.
  imageUrl: z
    .string()
    .min(1, "Image is required")
    .refine(
      v =>
        v.startsWith("data:image/") ||
        v.startsWith("http://") ||
        v.startsWith("https://"),
      "Must be a valid image"
    ),
  altText: z.string().nullable(),
  isPrimary: z.boolean(),
  displayOrder: z.number().int().min(0),
  // Client-side metadata for the image card display — not sent to the server.
  fileName: z.string().optional(),
  fileSize: z.number().optional(), // bytes
  mimeType: z.string().optional(),
});

export const productVariantSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1, "Variant name is required"),
    // sku: z.string().min(1, "SKU is required"),
    price: z
      .number({ error: "Price must be a number" })
      .positive("Price must be greater than 0"),
    mrp: z
      .number({ error: "MRP must be a number" })
      .positive("MRP must be greater than 0"),
    stockQuantity: z
      .number({ error: "Stock must be a number" })
      .int()
      .min(0, "Stock cannot be negative"),
    weight: z
      .number({ error: "Weight must be a number" })
      .positive("Weight must be greater than 0"),
    weightUnit: z.string().min(1, "Weight unit is required"),
    isDefault: z.boolean(),
    isActive: z.boolean(),
  })
  .refine(v => v.price <= v.mrp, {
    message: "Selling price must be <= MRP",
    path: ["price"],
  });

function getNormalizedWeightKey(weight: number, unit: string): string {
  return `${unit.toLowerCase()}:${weight.toFixed(6)}`;
}

const productVariantsSchema = z
  .array(productVariantSchema)
  .min(1, "At least 1 variant is required.")
  .max(2, "A maximum of 2 variants is allowed.")
  .superRefine((variants, context) => {
    const usedWeights = new Set<string>();

    variants.forEach((variant, index) => {
      const weightKey = getNormalizedWeightKey(variant.weight, variant.weightUnit);
      if (usedWeights.has(weightKey)) {
        context.addIssue({
          code: "custom",
          message: "This weight already exists for the selected unit.",
          path: [index, "weight"],
        });
      }
      usedWeights.add(weightKey);
    });

    if (variants.filter(variant => variant.isDefault).length !== 1) {
      context.addIssue({
        code: "custom",
        message: "Exactly one variant must be set as default.",
      });
    }
  });

export const productTagSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tag cannot be empty").max(50, "Tag is too long"),
});

// ─── Master product schema ─────────────────────────────────────────────────────

export const productSchema = z.object({
  // Step 1 — Basic Info
  categoryId: z.string().min(1, "Category is required"),
  name: z
    .string()
    .min(1, "Product name is required")
    .max(200, "Name is too long"),
  shortDescription: z
    .string()
    .max(300, "Short description must be under 300 characters"),
  description: z.string(),
  brand: z.string().min(1, "Brand is required"),
  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
  isTrending: z.boolean(),
  isNewArrival: z.boolean(),
  isActive: z.boolean(),

  // Step 2 — Details

  countryOfOrigin: z.string().min(1, "Country of origin is required"),
  isVegetarian: z.boolean(),
  shelfLife: z.string(),
  storageInstruction: z.string(),
  ingredients: z.string(),
  nutritionalInformation: z.string(),
  barcode: z.string().nullable(),

  // Step 3 — Variants
  variants: productVariantsSchema,
  // Step 4 — Tags
  tags: z
      .array(productTagSchema)
      .max(7,"A maximum of 7 tags is allowed."),

  // Step 5 — Images
  images: z
    .array(productImageSchema)
    .min(1, "At least 1 image is required")
    .max(2,"A maximum of 2 images is allowed.")
    .refine(
      imgs => imgs.filter(i => i.isPrimary).length === 1,
      "Exactly one image must be set as primary"
    ),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductImageValue = z.infer<typeof productImageSchema>;

// ─── Per-step field lists (for step-level error detection) ────────────────────

export const STEP_FIELDS: Record<number, (keyof ProductFormValues)[]> = {
  1: [
    "categoryId",
    "name",
    "shortDescription",
    "description",
    "brand",
    "isFeatured",
    "isBestSeller",
    "isTrending",
    "isNewArrival",
    "isActive",
  ],
  2: [
    "countryOfOrigin",
    "isVegetarian",
    "shelfLife",
    "storageInstruction",
    "ingredients",
    "nutritionalInformation",
    "barcode",
  ],
  3: ["variants"],
  4: ["tags"],
  5: ["images"],
  6: [],
};



export interface AdminProductList {
  id: string;
  name: string;
  categoryName:string;
  slug:string;
  isFeatured: boolean | null;
  isBestSeller: boolean | null;
  isTrending: boolean | null;
  isNewArrival: boolean | null;
  isActive: boolean | null;
  shelfLife:string;
  createdOn: string;
  imageUrl: string; // empty string will come
  stock: number;
  /** Tilde-separated price and variant weight, e.g. "200~250gm". */
  price: string[];
  isCategoryActive:boolean
}

export interface ProductImage {
  productId: string;
  imageurl: string;
}

export interface GetProductImagesRequestPayload {
  productIds: string[];
}

export type ProductImagesDictionary = Record<string, ProductImage>;

export interface ProductDetailsResponse {
  id: string;
  categoryId: string;
  name: string;
  shortDescription: string;
  description: string;
  brand: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  countryOfOrigin: string;
  isVegetarian: boolean;
  shelfLife: string;
  storageInstruction: string;
  ingredients: string;
  nutritionalInformation: string;
  barcode: string | null;
  images: Array<{
    id: string;
    imageUrl: string;
    altText: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }>;
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    mrp: number;
    stockQuantity: number;
    weight: number;
    weightUnit: string;
    isDefault: boolean;
    isActive: boolean;
  }>;
  tags: Array<{
    id: string;
    name: string;
  }>;
}
