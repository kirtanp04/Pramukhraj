import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LowStockNoticeProps {
  stock: number
  className?: string
}

export function LowStockNotice({ stock, className }: LowStockNoticeProps) {
  if (!Number.isFinite(stock) || stock <= 0 || stock >= 5) return null

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs! font-semibold text-oxblood', className)}
      aria-label={`Low stock. Only ${stock} ${stock === 1 ? 'item' : 'items'} remaining.`}
    >
      <Flame size={13} aria-hidden="true" />
      Hurry, only {stock} left!
    </span>
  )
}
