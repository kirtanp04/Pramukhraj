import type { UseFormReturn } from 'react-hook-form'
import type { ProductFormValues } from '@/types/productSchema'
import { FormField, ToggleField, inputCls } from '@/components/admin/product/FormField'

// In a real project, categories come from the API. Passed as a prop so this
// component stays pure and the parent handles fetching.
interface Category {
  id: string
  name: string
}

interface Step1BasicInfoProps {
  form: UseFormReturn<ProductFormValues>
  categories: Category[]
}

export function Step1BasicInfo({ form, categories }: Step1BasicInfoProps) {
  const { register, formState: { errors }, watch, setValue } = form

  return (
    <div className="space-y-6">
      {/* ── Section: Identity ── */}
      <section>
        <h3 className="mb-4 font-display text-base font-semibold text-ink">
          Product Identity
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <FormField
            label="Product Name"
            error={errors.name?.message}
            required
            className="sm:col-span-2"
          >
            <input
              {...register('name')}
              placeholder="e.g. Classic Masala Papad"
              className={inputCls(!!errors.name)}
            />
          </FormField>

          {/* Category */}
          <FormField label="Category" error={errors.categoryId?.message} required>
            <select {...register('categoryId')} className={inputCls(!!errors.categoryId)}>
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>

          {/* Brand */}
          <FormField label="Brand" error={errors.brand?.message} required>
            <input
              {...register('brand')}
              placeholder="e.g. Pramukhraj"
              className={inputCls(!!errors.brand)}
            />
          </FormField>

          {/* Short Description */}
          <FormField
            label="Short Description"
            error={errors.shortDescription?.message}
            hint="Displayed in cards and search results (max 300 chars)"
            className="sm:col-span-2"
          >
            <input
              {...register('shortDescription')}
              placeholder="One-line summary of the product"
              maxLength={300}
              className={inputCls(!!errors.shortDescription)}
            />
          </FormField>

          {/* Long Description */}
          <FormField
            label="Description"
            error={errors.description?.message}
            hint="Full product detail shown on the product page"
            className="sm:col-span-2"
          >
            <textarea
              {...register('description')}
              rows={5}
              placeholder="Describe the product in detail…"
              className={inputCls(!!errors.description)}
            />
          </FormField>
        </div>
      </section>

      {/* ── Section: Visibility flags ── */}
      <section>
        <h3 className="mb-1 font-display text-base font-semibold text-ink">Status & Visibility</h3>
        <p className="mb-4 text-xs text-ink-soft">
          Control where this product appears across the storefront.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <ToggleField
            label="Active"
            description="Visible to customers on the storefront"
            checked={watch('isActive')}
            onCheckedChange={(v) => setValue('isActive', v)}
          />
          <ToggleField
            label="Featured"
            description="Shown in the Featured section on the homepage"
            checked={watch('isFeatured')}
            onCheckedChange={(v) => setValue('isFeatured', v)}
          />
          <ToggleField
            label="Best Seller"
            description="Tagged as a best seller across the site"
            checked={watch('isBestSeller')}
            onCheckedChange={(v) => setValue('isBestSeller', v)}
          />
          <ToggleField
            label="Trending"
            description="Shown in Trending Now section"
            checked={watch('isTrending')}
            onCheckedChange={(v) => setValue('isTrending', v)}
          />
          <ToggleField
            label="New Arrival"
            description="Shown in New Arrivals section"
            checked={watch('isNewArrival')}
            onCheckedChange={(v) => setValue('isNewArrival', v)}
          />
        </div>
      </section>
    </div>
  )
}