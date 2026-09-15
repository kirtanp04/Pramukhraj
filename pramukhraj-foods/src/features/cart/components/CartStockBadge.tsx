import { cn } from '@/lib/utils'
import { stockTone } from '../utils/cart.utils'
import type { CartStockStatus } from '../types/cart.types'

export function CartStockBadge({ status, message }: { status: CartStockStatus; message: string }) {
  return <span className={cn('inline-flex rounded-full px-2 py-1 text-[11px] font-medium', stockTone(status))}>{message}</span>
}
