import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

const badgeVariants = cva('stamp-badge inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium uppercase', {
  variants: {
    variant: {
      oxblood: 'bg-oxblood text-ivory',
      turmeric: 'bg-turmeric text-teal-deep',
      teal: 'bg-teal text-ivory',
      outline: 'border border-ink/20 text-ink-soft',
      soft: 'bg-tan text-ink-soft',
    },
  },
  defaultVariants: { variant: 'soft' },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}
