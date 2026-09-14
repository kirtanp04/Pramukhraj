import { afterEach, describe, expect, it, vi } from 'vitest'
import { customerProductApi } from '@/services/customerProductApi'
import { loadCustomerProductImage } from '@/services/customerProductImageLoader'

vi.mock('@/services/customerProductApi', () => ({
  customerProductApi: {
    getImagesByIds: vi.fn(),
  },
}))

describe('customer product image loader', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('deduplicates visible products, batches requests, and reuses cached images', async () => {
    vi.useFakeTimers()
    vi.mocked(customerProductApi.getImagesByIds).mockResolvedValue({
      'product-visible-a': { productId: 'product-visible-a', imageurl: '/images/a.webp' },
      'product-visible-b': { productId: 'product-visible-b', imageurl: '/images/b.webp' },
    })

    const first = loadCustomerProductImage('product-visible-a')
    const duplicate = loadCustomerProductImage('PRODUCT-VISIBLE-A')
    const second = loadCustomerProductImage('product-visible-b')

    await vi.runAllTimersAsync()

    await expect(first).resolves.toBe('/images/a.webp')
    await expect(duplicate).resolves.toBe('/images/a.webp')
    await expect(second).resolves.toBe('/images/b.webp')
    expect(customerProductApi.getImagesByIds).toHaveBeenCalledTimes(1)
    expect(customerProductApi.getImagesByIds).toHaveBeenCalledWith([
      'product-visible-a',
      'product-visible-b',
    ])

    await expect(loadCustomerProductImage('product-visible-a')).resolves.toBe('/images/a.webp')
    expect(customerProductApi.getImagesByIds).toHaveBeenCalledTimes(1)
  })

})
