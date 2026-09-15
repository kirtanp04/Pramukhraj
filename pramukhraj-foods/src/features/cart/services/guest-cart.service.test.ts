import { beforeEach, describe, expect, it } from 'vitest'
import { GUEST_CART_STORAGE_KEY, guestCartService } from './guest-cart.service'

class MemoryStorage {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
  clear() { this.values.clear() }
}

const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'localStorage', { value: storage })

describe('guest cart storage', () => {
  beforeEach(() => storage.clear())

  it('adds, updates and removes a cart item', () => {
    const id = 'd2719f44-6ed0-4dc8-a15f-198c13710001'
    expect(guestCartService.add(id, 2).items[0]?.quantity).toBe(2)
    expect(guestCartService.update(id, 4).items[0]?.quantity).toBe(4)
    expect(guestCartService.remove(id).items).toEqual([])
  })

  it('recovers from corrupted storage', () => {
    localStorage.setItem(GUEST_CART_STORAGE_KEY, '{broken')
    expect(guestCartService.read().items).toEqual([])
    expect(localStorage.getItem(GUEST_CART_STORAGE_KEY)).toBeNull()
  })

  it('sanitizes duplicate variants and caps quantity', () => {
    const id = 'd2719f44-6ed0-4dc8-a15f-198c13710002'
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), items: [
      { productVariantId: id, quantity: 12 }, { productVariantId: id.toUpperCase(), quantity: 12 },
      { productVariantId: 'not-a-guid', quantity: -1 },
    ] }))
    expect(guestCartService.read().items).toEqual([{ productVariantId: id, quantity: 20 }])
  })
})
