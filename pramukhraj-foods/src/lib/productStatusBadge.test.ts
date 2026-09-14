import { describe, expect, it } from 'vitest'
import { productStatuses } from '@/constants/searchQueryParams'
import { getProductStatusBadge } from '@/lib/productStatusBadge'
import type { Product } from '@/types/catalog'

function productWithStatuses(statuses: Partial<Pick<Product, 'bestSeller' | 'newArrival' | 'trending'>>): Product {
  return {
    bestSeller: false,
    newArrival: false,
    trending: false,
    ...statuses,
  } as Product
}

describe('getProductStatusBadge', () => {
  it('shows the only active status without a status filter', () => {
    expect(getProductStatusBadge(productWithStatuses({ newArrival: true }), null)).toEqual({
      label: 'New',
      variant: 'teal',
    })
  })

  it('shows only the selected status when multiple statuses are active', () => {
    const product = productWithStatuses({ bestSeller: true, newArrival: true, trending: true })

    expect(getProductStatusBadge(product, productStatuses.trending)).toEqual({
      label: 'Trending',
      variant: 'turmeric',
    })
  })

  it('hides a multi-status chip when category filtering leaves no status selected', () => {
    const product = productWithStatuses({ bestSeller: true, newArrival: true })

    expect(getProductStatusBadge(product, null)).toBeNull()
  })

  it('hides a multi-status chip when the selected status is not one of the three chip statuses', () => {
    const product = productWithStatuses({ bestSeller: true, trending: true })

    expect(getProductStatusBadge(product, productStatuses.featured)).toBeNull()
  })
})
