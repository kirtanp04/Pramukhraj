import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { Info } from 'lucide-react'

interface MetricInfoTooltipProps {
  label: string
  children: string
  example?: string
}

export function MetricInfoTooltip({ label, children, example }: MetricInfoTooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            aria-label={`About ${label}`}
            className="inline-flex h-6 w-6 shrink-0 cursor-help items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oxblood/40"
          >
            <Info size={14} aria-hidden />
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            sideOffset={7}
            collisionPadding={12}
            className="z-[100] max-w-80 rounded-lg border border-ink/10 bg-ink px-3 py-2.5 text-xs leading-5 text-ivory shadow-xl"
          >
            <span className="font-semibold">{label}:</span> {children}
            {example && <span className="mt-2 block border-t border-ivory/20 pt-2 text-ivory/90"><span className="font-semibold text-ivory">Current example:</span> {example}</span>}
            <TooltipPrimitive.Arrow className="fill-ink" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
