import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Rating({
  value,
  count,
  size = 14,
  inverse = false,
}: {
  value: number
  count?: number
  size?: number
  inverse?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={cn(
              i < Math.round(value)
                ? inverse ? 'fill-amber-300 text-amber-300' : 'fill-turmeric text-turmeric'
                : inverse ? 'fill-transparent text-white/35' : 'fill-transparent text-ink/20',
            )}
          />
        ))}
      </div>
      <span className={cn('text-xs font-mono', inverse ? 'text-white/75' : 'text-ink-soft')}>
        {value.toFixed(1)}
        {count != null && <span className="ml-1">({count})</span>}
      </span>
    </div>
  )
}
