export type GuestCartItem = { productVariantId: string; quantity: number }
export type GuestCart = { version: 1; items: GuestCartItem[]; updatedAt: string }

export type CartStockStatus = 1 | 2 | 3 | 4

export interface CartVariantOption {
  variantId: string; name: string; price: number; mrp: number; weight: number; weightUnit: string
  availableStock: number; stockStatus: CartStockStatus; isActive: boolean; isCurrentVariant: boolean; canSelect: boolean
}

export interface CartItem {
  cartItemId: string | null; productId: string; productName: string; productSlug: string
  productVariantId: string; variantName: string; sku: string; quantity: number; price: number; mrp: number
  weight: number; weightUnit: string; availableStock: number; stockStatus: CartStockStatus; stockMessage: string
  isProductActive: boolean; isVariantActive: boolean; isAvailable: boolean; canIncreaseQuantity: boolean
  canDecreaseQuantity: boolean; isSelected: boolean; imageUrl: string; otherVariants: CartVariantOption[]
  lineSubtotal: number; lineMRP: number; lineDiscount: number
}

export interface CartAvailabilityWarning { productVariantId: string | null; code: string; message: string }

export interface CartResponse {
  cartId: string | null; cartVersion: number; isAuthenticatedCart: boolean; totalItemCount: number
  distinctItemCount: number; subtotal: number; totalMRP: number; totalDiscount: number; canCheckout: boolean
  availabilityWarnings: CartAvailabilityWarning[]; items: CartItem[]
}
