import type { CartVariantOption } from '../types/cart.types'

export function CartVariantSelector({ options, disabled, onChange }: { options: CartVariantOption[]; disabled: boolean; onChange: (id: string) => void }) {
  if (options.length < 2) return null
  const current = options.find(option => option.isCurrentVariant)?.variantId
  return <label className="flex items-center gap-2 text-xs text-ink-soft">Variant<select aria-label="Product variant" value={current} disabled={disabled} onChange={event => onChange(event.target.value)} className="rounded-lg border border-ink/15 bg-white px-2 py-1.5 text-ink">{options.map(option => <option key={option.variantId} value={option.variantId} disabled={!option.canSelect}>{option.name} {!option.canSelect ? '(unavailable)' : ''}</option>)}</select></label>
}
