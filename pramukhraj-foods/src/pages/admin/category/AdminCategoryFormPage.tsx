import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import { CategoryImageUploader } from '@/components/admin/category/CategoryImageUploader'
import { FormField, ToggleField, inputCls } from '@/components/admin/product/FormField'
import { Button } from '@/components/ui/Button'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage } from '@/lib/apiClient'
import { cn } from '@/lib/utils'
import { productCategoryApi } from '@/services/productCategoryApi'
import {
  DEFAULT_PRODUCT_CATEGORY_VALUES,
  productCategorySchema,
  type AddProductCategoryRequest,
} from '@/types/productCategorySchema'
import type { Category } from '@/types/catalog'
import type { ProductCategoryListRouteState } from '@/types/productCategory'

function toCategory(values: AddProductCategoryRequest, id: string): Category {
  return {
    id,
    name: values.name,
    slug: values.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
    description: values.description,
    icon: 'image',
    image: values.imageUrl,
    productCount: 0,
  }
}

export function AdminCategoryFormPage() {
  const navigate = useNavigate()
  const dialog = useMessageDialog()
  const form = useForm<AddProductCategoryRequest>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: DEFAULT_PRODUCT_CATEGORY_VALUES,
    mode: 'onChange',
  })

  const { register, control, setError, clearErrors, formState: { errors, isSubmitting } } = form

  function goBack() {
    navigate('/admin/categories')
  }

  async function onSubmit(values: AddProductCategoryRequest) {
    try {
      const response = await productCategoryApi.add({
        name: values.name,
        description: values.description,
        imageUrl: values.imageUrl,
        displayOrder: values.displayOrder,
        isFeatured: values.isFeatured,
        isActive: values.isActive,
      })

      const routeState: ProductCategoryListRouteState = {
        createdCategory: toCategory(values, response.data ?? crypto.randomUUID()),
      }

      dialog.success(response.message, {
        title: 'Category Created',
        actionLabel: 'Back to Categories',
        onAction: () => navigate('/admin/categories', { state: routeState }),
      })
    } catch (error: unknown) {
      dialog.error(getApiErrorMessage(error), {
        title: 'Could Not Create Category',
      })
    }
  }

  function onInvalid() {
    dialog.error(
      'Some category details are incomplete or invalid. Please fix the highlighted fields.',
      { title: 'Cannot Create Category' },
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={goBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink-soft hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Back to categories"
        >
          <ArrowLeft size={16} aria-hidden />
        </button>
        <div>
          <h1 className="font-display text-2xl">New Category</h1>
          <p className="text-sm text-ink-soft">Create a new category for organizing your product catalog.</p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        noValidate
        aria-busy={isSubmitting}
        className="space-y-4"
      >
        <div
          className={cn(
            'rounded-card border border-ink/10 bg-ivory px-5 py-6 shadow-sm transition-opacity md:px-8 md:py-8',
            isSubmitting && 'pointer-events-none opacity-70',
          )}
          aria-disabled={isSubmitting}
        >
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
            <section className="space-y-5" aria-labelledby="category-details-heading">
              <div>
                <h2 id="category-details-heading" className="font-display text-base font-semibold text-ink">Category Details</h2>
                <p className="text-xs text-ink-soft">Add the information customers will see across the catalog.</p>
              </div>

              <FormField label="Category Name" htmlFor="category-name" error={errors.name?.message} required>
                <input
                  id="category-name"
                  {...register('name')}
                  maxLength={255}
                  placeholder="e.g. Traditional Snacks"
                  autoComplete="off"
                  className={inputCls(!!errors.name)}
                />
              </FormField>

              <FormField
                label="Description"
                htmlFor="category-description"
                error={errors.description?.message}
                hint="Briefly explain what products belong in this category (max 1,000 characters)."
              >
                <textarea
                  id="category-description"
                  {...register('description')}
                  rows={6}
                  maxLength={1_000}
                  placeholder="Describe this category..."
                  className={cn(inputCls(!!errors.description), 'resize-y')}
                />
              </FormField>

              <FormField
                label="Display Order"
                htmlFor="category-display-order"
                error={errors.displayOrder?.message}
                hint="Lower numbers appear first in category listings."
                required
              >
                <input
                  id="category-display-order"
                  type="number"
                  min={0}
                  step={1}
                  {...register('displayOrder', { valueAsNumber: true })}
                  className={inputCls(!!errors.displayOrder)}
                />
              </FormField>

              <div className="grid gap-3 sm:grid-cols-2">
                <Controller
                  name="isFeatured"
                  control={control}
                  render={({ field }) => (
                    <ToggleField
                      label="Featured Category"
                      description="Highlight this category on the storefront."
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <ToggleField
                      label="Active"
                      description="Make this category available immediately."
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </div>
            </section>

            <section className="space-y-3" aria-labelledby="category-image-heading">
              <div>
                <h2 id="category-image-heading" className="font-display text-base font-semibold text-ink">Category Image</h2>
                <p className="text-xs text-ink-soft">Upload one clear image representing this category.</p>
              </div>
              <Controller
                name="imageUrl"
                control={control}
                render={({ field }) => (
                  <CategoryImageUploader
                    value={field.value}
                    error={errors.imageUrl?.message}
                    disabled={isSubmitting}
                    onChange={(imageUrl) => {
                      field.onChange(imageUrl)
                      if (imageUrl) clearErrors('imageUrl')
                    }}
                    onError={(message) => {
                      if (message) setError('imageUrl', { type: 'validate', message })
                      else clearErrors('imageUrl')
                    }}
                  />
                )}
              />
            </section>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 rounded-card border border-ink/10 bg-ivory px-5 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={goBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-40">
            {isSubmitting ? (
              <><LoaderCircle size={15} className="animate-spin" aria-hidden /> Creating Category...</>
            ) : (
              <><Save size={15} aria-hidden /> Create Category</>
            )}
          </Button>
        </div>
      </form>

      <MessageDialog {...dialog.props} />
    </div>
  )
}
