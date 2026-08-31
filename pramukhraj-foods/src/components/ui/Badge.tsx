import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
        oxblood: 'bg-oxblood/10 text-oxblood',
        turmeric: 'bg-turmeric/15 text-turmeric-deep',
        teal: 'bg-teal/10 text-teal',
        outline: 'border border-ink/15 bg-transparent text-ink-soft',
        soft: 'bg-ink/5 text-ink-soft',
      },
    },
    defaultVariants: { variant: 'soft' },
  },
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}
