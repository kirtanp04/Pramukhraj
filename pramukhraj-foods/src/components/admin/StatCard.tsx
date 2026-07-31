import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatCard({
  label, value, icon: Icon, change, positive = true,
}: {
  label: string
  value: string
  icon: LucideIcon
  change?: string
  positive?: boolean
}) {
  return (
    <div className="rounded-card border border-ink/10 bg-ivory p-5">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-oxblood/10 text-oxblood">
          <Icon size={17} />
        </span>
        {change && (
          <span className={cn('flex items-center gap-0.5 text-xs font-medium', positive ? 'text-green-700' : 'text-oxblood')}>
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />} {change}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  )
}
