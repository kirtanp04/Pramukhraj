import type { CartStockStatus } from '../types/cart.types'

export const fallbackProductImage = '/favicon.ico'
export const stockTone = (status: CartStockStatus) => status === 1 ? 'text-green-700 bg-green-50'
  : status === 2 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
