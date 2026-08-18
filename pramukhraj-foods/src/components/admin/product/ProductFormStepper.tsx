import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductFormStep } from '@/model/Product'

interface ProductFormStepperProps {
  steps: ProductFormStep[]
  currentStep: number
  /** Step numbers that have at least one validation error */
  stepsWithErrors?: number[]
  onStepClick?: (step: number) => void
  /** Maximum step the user has visited — prevents jumping ahead */
  maxVisitedStep: number
}

export function ProductFormStepper({
  steps,
  currentStep,
  stepsWithErrors = [],
  onStepClick,
  maxVisitedStep,
}: ProductFormStepperProps) {
  return (
    <nav aria-label="Product form steps" className="w-full">
      {/* Desktop — horizontal */}
      <ol className="hidden items-center md:flex">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const hasError = stepsWithErrors.includes(step.id)
          const isClickable = step.id <= maxVisitedStep && !!onStepClick

          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.id)}
                className={cn(
                  'group flex items-center gap-2.5 text-left transition-opacity',
                  !isClickable && 'cursor-default opacity-60',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {/* Circle */}
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted && !hasError && 'border-teal bg-teal text-ivory',
                    isCurrent && !hasError && 'border-oxblood bg-oxblood text-ivory',
                    hasError && 'border-oxblood bg-oxblood/10 text-oxblood',
                    !isCompleted && !isCurrent && 'border-ink/20 text-ink-soft',
                  )}
                >
                  {isCompleted && !hasError ? (
                    <Check size={14} strokeWidth={3} />
                  ) : hasError ? (
                    <span className="font-mono text-xs font-bold">!</span>
                  ) : (
                    <span className="font-mono text-xs">{step.id}</span>
                  )}
                </span>

                {/* Label */}
                <span className="hidden lg:block">
                  <span
                    className={cn(
                      'block text-xs font-semibold',
                      isCurrent ? 'text-oxblood' : hasError ? 'text-oxblood' : 'text-ink',
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="block text-[11px] text-ink-soft">{step.description}</span>
                </span>
              </button>

              {/* Connector */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-3 h-0.5 flex-1',
                    step.id < currentStep ? 'bg-teal' : 'bg-ink/10',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Mobile — compact current/total */}
      <div className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-oxblood text-xs font-bold text-ivory">
            {currentStep}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">
              {steps.find((s) => s.id === currentStep)?.label}
            </p>
            <p className="text-xs text-ink-soft">
              Step {currentStep} of {steps.length}
            </p>
          </div>
        </div>
        {/* Mini dots */}
        <div className="flex gap-1">
          {steps.map((s) => (
            <span
              key={s.id}
              className={cn(
                'h-1.5 rounded-full transition-all',
                s.id === currentStep ? 'w-5 bg-oxblood' : s.id < currentStep ? 'w-1.5 bg-teal' : 'w-1.5 bg-ink/15',
              )}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}