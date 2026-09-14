import { describe, expect, it, vi } from 'vitest'
import { ApiPath } from '@/constants/apiPaths'
import { apiPost } from '@/lib/apiClient'
import { customerProductApi } from '@/services/customerProductApi'
import type { CustomerProductListItemResponse } from '@/types/customerProduct'

vi.mock('@/lib/apiClient', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

const product: CustomerProductListItemResponse = {
  productId: 'product-1',
  productName: 'Test product',
  productSlug: 'test-product',
  categoryId: 'category-1',
  categoryName: 'Category',
  categorySlug: 'category',
  brand: 'Pramukhraj',
  shortDescription: '',
  price: 100,
  mrp: 120,
  sku: 'SKU-1',
  weightUnit: 'g',
  weight: 100,
  productVariantId: 'variant-1',
  productVariantSku: 'SKU-1',
  stockQuantity: 5,
  isLowStock: false,
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  isTrending: false,
  imageUrl: '',
}

describe('customer product list API', () => {
  it('fetches and attaches images after receiving the current product page', async () => {
    vi.mocked(apiPost)
      .mockResolvedValueOnce({ products: [product], totalCount: 1, page: 1, pageSize: 20 })
      .mockResolvedValueOnce({
        'product-1': { productId: 'product-1', imageurl: '/images/product-1.webp' },
      })

    const request = { page: 1, pageSize: 20, maxPrice: 1000, sortBy: 0 as const }
    const response = await customerProductApi.getList(request)

    expect(apiPost).toHaveBeenNthCalledWith(
      1,
      ApiPath.customer.product.getList,
      request,
      { signal: undefined },
    )
    expect(apiPost).toHaveBeenNthCalledWith(
      2,
      ApiPath.customer.product.getImagesByIds,
      { productIds: ['product-1'] },
      { signal: undefined },
    )
    expect(response?.products[0]?.imageUrl).toBe('/images/product-1.webp')
  })
})
