import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function FormField({ label, error, hint, required, htmlFor, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-ink-soft">
        {label}
        {required && <span className="ml-0.5 text-oxblood" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-ink-soft">{hint}</p>}
      {error && (
        <p className="text-[11px] font-medium text-oxblood" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Shared input classnames (use on every <input> / <select> / <textarea>) ───

export function inputCls(hasError?: boolean) {
  return cn(
    'w-full rounded-lg border bg-ivory px-3 py-2 text-sm text-ink outline-none transition-colors',
    'placeholder:text-ink-soft/50',
    hasError
      ? 'border-oxblood/50 focus:border-oxblood'
      : 'border-ink/15 focus:border-oxblood/40',
  )
}

// ─── Toggle switch (replaces checkboxes for boolean flags) ───────────────────

import * as Switch from '@radix-ui/react-switch'

interface ToggleFieldProps {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
}

export function ToggleField({ label, description, checked, onCheckedChange, disabled }: ToggleFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-ink/10 bg-ivory-dim px-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-ink-soft">{description}</p>}
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-oxblood' : 'bg-ink/15',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <Switch.Thumb
          className={cn(
            'block h-4 w-4 rounded-full bg-ivory shadow transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </Switch.Root>
    </div>
  )
}
