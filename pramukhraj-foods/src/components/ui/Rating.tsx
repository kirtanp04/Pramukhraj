import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Rating({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={cn(
              i < Math.round(value) ? 'fill-turmeric text-turmeric' : 'fill-transparent text-ink/20',
            )}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-ink-soft">
        {value.toFixed(1)}
        {count != null && <span className="ml-1">({count})</span>}
      </span>
    </div>
  )
}
