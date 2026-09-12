import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CacheMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'oxblood',
}: {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone?: 'oxblood' | 'teal' | 'turmeric'
}) {
  return (
    <div className="rounded-card border border-ink/10 bg-ivory p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">{label}</p>
          <p className="mt-2 font-display text-3xl tracking-tight">{value}</p>
        </div>
        <span className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          tone === 'oxblood' && 'bg-oxblood/10 text-oxblood',
          tone === 'teal' && 'bg-teal/10 text-teal',
          tone === 'turmeric' && 'bg-turmeric/15 text-turmeric-deep',
        )}>
          <Icon size={18} aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-xs text-ink-soft">{detail}</p>
    </div>
  )
}
