import { Minus, Plus } from 'lucide-react'

export function CartQuantityControl({ value, canDecrease, canIncrease, disabled, onChange }: {
  value: number; canDecrease: boolean; canIncrease: boolean; disabled: boolean; onChange: (value: number) => void
}) {
  return <div className="inline-flex items-center rounded-full border border-ink/15" aria-label="Quantity"><button type="button" aria-label="Decrease quantity" className="grid h-8 w-8 place-items-center disabled:opacity-35" disabled={disabled || !canDecrease} onClick={() => onChange(value - 1)}><Minus size={13}/></button><span className="min-w-8 text-center font-mono text-sm" aria-live="polite">{value}</span><button type="button" aria-label="Increase quantity" className="grid h-8 w-8 place-items-center disabled:opacity-35" disabled={disabled || !canIncrease} onClick={() => onChange(value + 1)}><Plus size={13}/></button></div>
}
