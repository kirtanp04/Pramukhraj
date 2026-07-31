import type { LucideIcon } from 'lucide-react'
import { Construction } from 'lucide-react'

export function ComingSoon({ title, description, icon: Icon = Construction }: { title: string; description?: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-ink/15 py-16 text-center">
      <Icon size={32} className="text-ink-soft" />
      <p className="mt-3 font-display text-lg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
    </div>
  )
}
