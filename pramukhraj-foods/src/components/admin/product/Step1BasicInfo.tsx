import type { UseFormReturn } from 'react-hook-form'
import { AlertCircle, LoaderCircle, RefreshCw } from 'lucide-react'
import type { ProductFormValues } from '@/types/productSchema'
import type { ComboData } from '@/types/common'
import { FormField, ToggleField, inputCls } from '@/components/admin/product/FormField'

interface Step1BasicInfoProps {
  form: UseFormReturn<ProductFormValues>
  categories: ComboData[]
  categoriesLoading: boolean
  categoriesError: string | null
  onRetryCategories: () => void
}

export function Step1BasicInfo({
  form,
  categories,
  categoriesLoading,
  categoriesError,
  onRetryCategories,
}: Step1BasicInfoProps) {
  const { register, formState: { errors }, watch, setValue } = form
  const categoriesUnavailable = categoriesLoading || !!categoriesError || categories.length === 0

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
          <FormField
            label="Category"
            error={errors.categoryId?.message}
            hint={!categoriesUnavailable ? `${categories.length} active categories available` : undefined}
            required
          >
            <div className="relative">
              <select
                {...register('categoryId')}
                disabled={categoriesUnavailable}
                aria-busy={categoriesLoading}
                className={`${inputCls(!!errors.categoryId)} disabled:cursor-not-allowed disabled:bg-ivory-dim disabled:text-ink-soft`}
              >
                <option value="">
                  {categoriesLoading
                    ? 'Loading categories...'
                    : categoriesError
                      ? 'Categories unavailable'
                      : categories.length === 0
                        ? 'No active categories available'
                        : '— Select category —'}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {categoriesLoading && (
                <LoaderCircle
                  size={15}
                  className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-oxblood"
                  aria-hidden
                />
              )}
            </div>

            {categoriesError && (
              <div
                className="mt-1.5 flex items-start justify-between gap-3 rounded-lg border border-oxblood/20 bg-oxblood/5 px-3 py-2"
                role="alert"
              >
                <p className="flex min-w-0 items-start gap-1.5 text-[11px] text-oxblood">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden />
                  <span>{categoriesError}</span>
                </p>
                <button
                  type="button"
                  onClick={onRetryCategories}
                  className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-oxblood hover:text-oxblood-deep"
                >
                  <RefreshCw size={11} aria-hidden /> Retry
                </button>
              </div>
            )}

            {!categoriesLoading && !categoriesError && categories.length === 0 && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-turmeric-deep" role="status">
                <AlertCircle size={13} aria-hidden />
                Create and activate a category before adding a product.
              </p>
            )}
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
