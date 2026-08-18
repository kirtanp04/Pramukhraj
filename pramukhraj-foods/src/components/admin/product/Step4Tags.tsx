import { useState, useRef } from 'react'
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import { X, Plus } from 'lucide-react'
import type { ProductFormValues } from '@/types/productSchema'
import { cn } from '@/lib/utils'

interface Step4TagsProps {
  form: UseFormReturn<ProductFormValues>
}

const SUGGESTED = ['Organic', 'Spicy', 'Sugar-free', 'Gluten-free', 'Vegan', 'Low-calorie', 'Premium', 'Traditional', 'Festive']

function generateId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function Step4Tags({ form }: Step4TagsProps) {
  const { control, watch, formState: { errors } } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'tags' })
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const existingNames = watch('tags').map((t) => t.name.toLowerCase())

  function addTag(name: string) {
    const trimmed = name.trim()
    if (!trimmed || existingNames.includes(trimmed.toLowerCase())) return
    append({ id: generateId(), name: trimmed })
    setInput('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && fields.length > 0) {
      remove(fields.length - 1)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-base font-semibold text-ink">Tags</h3>
        <p className="text-xs text-ink-soft">
          Tags help customers find this product through search and filters.
          Press <kbd className="rounded border border-ink/15 px-1 font-mono text-[10px]">Enter</kbd> or{' '}
          <kbd className="rounded border border-ink/15 px-1 font-mono text-[10px]">,</kbd> to add a tag.
        </p>
      </div>

      {/* Tag input area */}
      <div
        className={cn(
          'flex min-h-20 flex-wrap items-start gap-2 rounded-lg border bg-ivory px-3 py-2.5 transition-colors focus-within:border-oxblood/40',
          errors.tags ? 'border-oxblood/50' : 'border-ink/15',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {fields.map((field, index) => (
          <span
            key={field.id}
            className="flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal"
          >
            {watch(`tags.${index}.name`)}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(index) }}
              aria-label="Remove tag"
              className="ml-0.5 rounded-full p-0.5 hover:bg-teal/20"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={fields.length === 0 ? 'Type a tag and press Enter…' : ''}
          className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/50 min-w-35"
        />
      </div>

      {/* Add button for small screens */}
      {input.trim() && (
        <button
          type="button"
          onClick={() => addTag(input)}
          className="flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1 text-xs hover:bg-ink/5"
        >
          <Plus size={12} /> Add &quot;{input.trim()}&quot;
        </button>
      )}

      {/* Suggestions */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-soft">Suggestions</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.filter((s) => !existingNames.includes(s.toLowerCase())).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-ink/15 px-3 py-1 text-xs text-ink-soft hover:border-oxblood/40 hover:text-oxblood"
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        {fields.length} tag{fields.length !== 1 ? 's' : ''} added
      </p>
    </div>
  )
}