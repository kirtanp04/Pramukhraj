import { CheckCircle2, AlertTriangle, Star } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import type { ProductFormValues } from '@/types/productSchema'
import { cn } from '@/lib/utils'
import { Product } from '@/model/Product'

interface Step6ReviewProps {
  form: UseFormReturn<ProductFormValues>
  categories: { id: string; name: string }[]
}

function ReviewRow({
  label,
  value,
  warn,
}: {
  label: string
  value: React.ReactNode
  warn?: boolean
}) {
  return (
    <div className="flex items-start gap-4 border-b border-ink/5 py-2.5 last:border-0">
      <span className="w-44 shrink-0 text-xs text-ink-soft">{label}</span>
      <span className={cn('flex-1 text-sm wrap-break-word', warn && 'text-turmeric-deep')}>
        {value || <span className="italic text-ink-soft/50">—</span>}
      </span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-1 mt-6 font-display text-sm font-semibold text-ink first:mt-0">
      {children}
    </h4>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Step6Review({ form, categories }: Step6ReviewProps) {
  const values = form.watch()
  const hasErrors = Object.keys(form.formState.errors).length > 0
  const category = categories.find((c) => c.id === values.categoryId)
  const primaryImage = values.images?.find((i) => i.isPrimary)

  const flags = [
    values.isActive && 'Active',
    values.isFeatured && 'Featured',
    values.isBestSeller && 'Best Seller',
    values.isTrending && 'Trending',
    values.isNewArrival && 'New Arrival',
    values.isVegetarian && 'Vegetarian',
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div>
        <h3 className="font-display text-base font-semibold text-ink">
          Review Before Saving
        </h3>
        <p className="text-xs text-ink-soft">
          Check everything looks correct — click any step in the progress bar to go back and edit.
        </p>
      </div>

      {/* ── Validation status banner ── */}
      {hasErrors ? (
        <div className="flex items-center gap-2 rounded-lg border border-turmeric/40 bg-turmeric/10 px-4 py-3 text-sm text-turmeric-deep">
          <AlertTriangle size={16} className="shrink-0" />
          Some steps have validation errors — go back to fix them before saving.
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={16} className="shrink-0" />
          All fields look good — ready to save!
        </div>
      )}

      {/* ── Primary image hero ── */}
      {primaryImage && (
        <div className="overflow-hidden rounded-card border border-turmeric/30">
          <div className="relative h-48 w-full bg-ivory-dim">
            <img
              src={primaryImage.imageUrl}
              alt={primaryImage.altText ?? values.name}
              className="h-full w-full object-contain"
            />
            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-turmeric/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-deep">
              <Star size={9} fill="currentColor" /> Primary
            </span>
          </div>
          {primaryImage.fileName && (
            <p className="bg-ivory px-3 py-1.5 text-[11px] text-ink-soft">
              {primaryImage.fileName}
              {primaryImage.fileSize ? ` · ${formatBytes(primaryImage.fileSize)}` : ''}
              {primaryImage.mimeType
                ? ` · ${primaryImage.mimeType.replace('image/', '').toUpperCase()}`
                : ''}
            </p>
          )}
        </div>
      )}

      {/* ── Summary card ── */}
      <div className="rounded-card border border-ink/10 bg-ivory px-5 py-4">

        {/* Basic Info */}
        <SectionTitle>Basic Info</SectionTitle>
        <ReviewRow label="Product Name" value={values.name} />
        <ReviewRow
          label="Category"
          value={category?.name}
          warn={!category}
        />
        <ReviewRow label="Brand" value={values.brand} />
        <ReviewRow label="Short Description" value={values.shortDescription} />
        <ReviewRow
          label="Description"
          value={
            values.description
              ? `${values.description.slice(0, 120)}${values.description.length > 120 ? '…' : ''}`
              : undefined
          }
        />
        <ReviewRow
          label="Flags"
          value={
            flags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(flags as string[]).map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-teal/10 px-2 py-0.5 text-xs text-teal"
                  >
                    {f}
                  </span>
                ))}
              </div>
            ) : (
              'None'
            )
          }
        />

        {/* Details */}
        <SectionTitle>Details</SectionTitle>
       
        <ReviewRow
          label="Country of Origin"
          value={values.countryOfOrigin}
          warn={!values.countryOfOrigin}
        />
        <ReviewRow label="Barcode / EAN" value={values.barcode ?? undefined} />
        <ReviewRow
          label="Shelf Life"
          value={values.shelfLife || 'Lifetime (no expiry)'}
        />
        <ReviewRow
          label="Ingredients"
          value={
            values.ingredients
              ? `${values.ingredients.slice(0, 100)}${values.ingredients.length > 100 ? '…' : ''}`
              : undefined
          }
        />
        <ReviewRow
          label="Nutritional Info"
          value={
            values.nutritionalInformation
              ? `${values.nutritionalInformation.slice(0, 100)}${values.nutritionalInformation.length > 100 ? '…' : ''}`
              : undefined
          }
        />
        <ReviewRow
          label="Storage Instructions"
          value={
            values.storageInstruction
              ? `${values.storageInstruction.slice(0, 100)}${values.storageInstruction.length > 100 ? '…' : ''}`
              : undefined
          }
        />

        {/* Variants */}
        <SectionTitle>
          Variants ({values.variants?.length ?? 0})
        </SectionTitle>
        {!values.variants?.length ? (
          <p className="py-1 text-xs italic text-ink-soft">No variants added.</p>
        ) : (
          <div className="space-y-1.5">
            {values.variants.map((v, i) => {
              const discount = Product.calculatedDiscountPercentage(v.mrp, v.price)
              return (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg px-3 py-2 text-xs',
                    v.isDefault ? 'bg-turmeric/10' : 'bg-ivory-dim',
                  )}
                >
                  <div className="flex items-center gap-2 font-medium text-ink">
                    {v.name || <span className="italic text-ink-soft">Unnamed</span>}
                    {v.isDefault && (
                      <span className="rounded-full bg-turmeric/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-turmeric-deep">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-3 text-ink-soft">
                    <span>SKU: {v.sku || '—'}</span>
                    <span>MRP: ₹{v.mrp}</span>
                    <span>Price: ₹{v.price}</span>
                    {discount > 0 && <span className="text-green-700">{discount}% off</span>}
                    <span>Stock: {v.stockQuantity}</span>
                    {v.weight > 0 && <span>Weight: {v.weight} {v.weightUnit}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tags */}
        <SectionTitle>Tags ({values.tags?.length ?? 0})</SectionTitle>
        <div className="flex flex-wrap gap-1.5 py-1">
          {!values.tags?.length ? (
            <span className="text-xs italic text-ink-soft">No tags.</span>
          ) : (
            values.tags.map((t, i) => (
              <span
                key={i}
                className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs text-teal"
              >
                {t.name}
              </span>
            ))
          )}
        </div>

        {/* Images */}
        <SectionTitle>
          Images ({values.images?.length ?? 0})
        </SectionTitle>
        {!values.images?.length ? (
          <p className="text-xs italic text-ink-soft">No images uploaded.</p>
        ) : (
          <div className="flex flex-wrap gap-2 py-1">
            {values.images.map((img, i) => (
              <div key={i} className="group relative">
                <div
                  className={cn(
                    'h-16 w-16 overflow-hidden rounded-lg border-2',
                    img.isPrimary ? 'border-turmeric' : 'border-transparent',
                  )}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.altText ?? ''}
                    className="h-full w-full object-cover"
                  />
                </div>
                {img.isPrimary && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-turmeric text-[8px] text-teal-deep">
                    <Star size={8} fill="currentColor" />
                  </span>
                )}
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink/80 px-2 py-1 text-[10px] text-ivory group-hover:block">
                  {img.fileName ?? `Image ${i + 1}`}
                  {img.fileSize ? ` · ${formatBytes(img.fileSize)}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}