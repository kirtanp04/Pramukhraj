import { describe, expect, it } from 'vitest'
import {
  parseProductCategorySlug,
  parseProductMaxPrice,
  parseProductPage,
  parseProductSearch,
  parseProductSort,
  parseProductStatus,
  toCustomerProductSort,
  toCustomerProductStatus,
} from '@/lib/productListing'

describe('product listing query parsing', () => {
  it('normalizes invalid URL values to safe defaults', () => {
    expect(parseProductPage('-2')).toBe(1)
    expect(parseProductMaxPrice('not-a-price')).toBe(1000)
    expect(parseProductSort('rating')).toBe('price-asc')
    expect(parseProductStatus('unknown')).toBeUndefined()
    expect(parseProductCategorySlug('../invalid')).toBeUndefined()
  })

  it('normalizes valid user input', () => {
    expect(parseProductPage('3')).toBe(3)
    expect(parseProductMaxPrice('450.4')).toBe(450)
    expect(parseProductCategorySlug('  Dry-Fruits ')).toBe('dry-fruits')
    expect(parseProductSearch('  cashew  ')).toBe('cashew')
  })

  it('maps public URL values to the API enum contract', () => {
    expect(toCustomerProductSort('price-desc')).toBe(1)
    expect(toCustomerProductStatus('new-arrivals')).toBe(0)
    expect(toCustomerProductStatus('deals')).toBe(4)
    expect(toCustomerProductStatus(undefined)).toBeUndefined()
  })
})
