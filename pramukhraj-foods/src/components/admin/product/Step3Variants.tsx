import { useEffect } from 'react'
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import { Plus, Trash2, Star } from 'lucide-react'
import type { ProductFormValues } from '@/types/productSchema'
import { FormField, ToggleField, inputCls } from '@/components/admin/product/FormField'

import { cn } from '@/lib/utils'
import { Product, WEIGHT_UNITS } from '@/model/Product'

interface Step3VariantsProps {
  form: UseFormReturn<ProductFormValues>
}

function generateId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function Step3Variants({ form }: Step3VariantsProps) {
  const { control, register, formState: { errors }, watch, setValue } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })
  const variantValues = watch('variants')

  useEffect(() => {
    if (variantValues.length > 0 && !variantValues.some((variant) => variant.isDefault)) {
      setValue('variants.0.isDefault', true, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [variantValues, setValue])

  function addVariant() {
    append({
      id: generateId(),
      name: '',
      // sku: '',
      price: 0,
      mrp: 0,
      stockQuantity: 0,
      weight: 0,
      weightUnit: 'gm',
      isDefault: fields.length === 0, // first is default
      isActive: true,
    })
  }

  function setDefault(index: number) {
    variantValues.forEach((_, variantIndex) => {
      setValue(`variants.${variantIndex}.isDefault`, variantIndex === index, {
        shouldDirty: true,
        shouldValidate: true,
      })
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2.5">
        <div className='max-w-[80%]'>
          <h3 className="font-display text-base font-semibold text-ink">Variants</h3>
          <p className="text-xs text-ink-soft">
            Each weight must be unique within its unit. For example, 250 gm can appear once,
            while 250 kg is a separate variant. The first variant becomes default if needed.
          </p>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-xs font-medium text-ivory hover:bg-oxblood-deep"
        >
          <Plus size={14} /> Add Variant
        </button>
      </div>

      {errors.variants?.root && (
        <p className="text-xs text-oxblood" role="alert">{errors.variants.root.message}</p>
      )}

      {fields.length === 0 && (
        <div className="rounded-card border border-dashed border-ink/15 py-10 text-center text-sm text-ink-soft">
          No variants yet — click <strong>Add Variant</strong> to create one.
        </div>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => {
          const v = variantValues?.[index]
          const discount = v ? Product.calculatedDiscountPercentage(v.mrp, v.price) : 0
          const err = errors.variants?.[index]

          return (
            <div
              key={field.id}
              className={cn(
                'rounded-card border bg-ivory-dim p-4',
                v?.isDefault ? 'border-turmeric/50' : 'border-ink/10',
              )}
            >
              {/* Variant header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-soft">#{index + 1}</span>
                  {v?.isDefault && (
                    <span className="flex items-center gap-1 rounded-full bg-turmeric/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-turmeric-deep">
                      <Star size={10} /> Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!v?.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefault(index)}
                      className="text-[11px] text-ink-soft hover:text-oxblood"
                    >
                      Set as default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded-full p-1.5 text-ink-soft hover:bg-oxblood/10 hover:text-oxblood"
                    aria-label="Remove variant"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Variant fields */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="Variant Name" error={err?.name?.message} required>
                  <input
                    {...register(`variants.${index}.name`)}
                    placeholder="e.g. 200g Pack"
                    className={inputCls(!!err?.name)}
                  />
                </FormField>

                {/* <FormField label="SKU" error={err?.sku?.message} required>
                  <input
                    {...register(`variants.${index}.sku`)}
                    placeholder="e.g. PRJ-PAP-200G"
                    className={inputCls(!!err?.sku)}
                  />
                </FormField> */}

                <FormField label="MRP (₹)" error={err?.mrp?.message} required>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register(`variants.${index}.mrp`, { valueAsNumber: true })}
                    placeholder="0"
                    className={inputCls(!!err?.mrp)}
                  />
                </FormField>

                <FormField
                  label="Selling Price (₹)"
                  error={err?.price?.message}
                  hint={discount > 0 ? `${discount}% off MRP` : undefined}
                  required
                >
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register(`variants.${index}.price`, { valueAsNumber: true })}
                    placeholder="0"
                    className={inputCls(!!err?.price)}
                  />
                </FormField>

                <FormField label="Stock Quantity" error={err?.stockQuantity?.message} required>
                  <input
                    type="number"
                    min="0"
                    {...register(`variants.${index}.stockQuantity`, { valueAsNumber: true })}
                    placeholder="0"
                    className={inputCls(!!err?.stockQuantity)}
                  />
                </FormField>

                <FormField label="Variant Weight" error={err?.weight?.message} required>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`variants.${index}.weight`, { valueAsNumber: true })}
                      placeholder="0"
                      className={inputCls(!!err?.weight)}
                    />
                    <select
                      {...register(`variants.${index}.weightUnit`)}
                      className={` ${inputCls()}`}
                    >
                      {WEIGHT_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </FormField>

                <ToggleField
                  label="Active"
                  description="Allow customers to purchase this variant"
                  checked={v?.isActive ?? true}
                  onCheckedChange={(isActive) => {
                    setValue(`variants.${index}.isActive`, isActive, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
