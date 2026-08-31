import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import { CategoryImageUploader } from '@/components/admin/category/CategoryImageUploader'
import { CategoryFormSkeleton } from '@/components/admin/category/CategoryFormSkeleton'
import { EntityFormError } from '@/components/admin/EntityFormError'
import { FormField, ToggleField, inputCls } from '@/components/admin/product/FormField'
import { Button } from '@/components/ui/Button'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/apiClient'
import { mapCategoryResponseToForm } from '@/lib/entityMappings'
import { isValidGuid } from '@/lib/routeParams'
import { cn } from '@/lib/utils'
import { productCategoryApi } from '@/services/productCategoryApi'
import {
  DEFAULT_PRODUCT_CATEGORY_VALUES,
  productCategorySchema,
  type AddProductCategoryRequest,
} from '@/types/productCategorySchema'
import type { ProductCategoryListRouteState } from '@/types/productCategory'

type FormMode = 'create' | 'edit'

export function AdminCategoryFormPage() {
  const { id } = useParams<{ id?: string }>()
  const mode: FormMode = id ? 'edit' : 'create'
  const isEditing = mode === 'edit'
  const navigate = useNavigate()
  const dialog = useMessageDialog()
  const [isInitialLoading, setIsInitialLoading] = useState(isEditing)
  const [loadError, setLoadError] = useState<{ message: string; status?: number } | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const mountedRef = useRef(true)
  const form = useForm<AddProductCategoryRequest>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: DEFAULT_PRODUCT_CATEGORY_VALUES,
    mode: 'onChange',
  })

  const {
    register,
    control,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = form
  const isBusy = isSubmitting || isSaving

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!isEditing) {
      setIsInitialLoading(false)
      setLoadError(null)
      return
    }

    if (!isValidGuid(id)) {
      setIsInitialLoading(false)
      setLoadError({ message: 'The category ID in this URL is invalid.', status: 400 })
      return
    }

    const categoryId = id

    const controller = new AbortController()

    async function loadCategory() {
      setIsInitialLoading(true)
      setLoadError(null)
      try {
        const category = await productCategoryApi.getById(categoryId, controller.signal)
        if (controller.signal.aborted) return
        if (!category) throw new Error('Category not found.')
        reset(productCategorySchema.parse(mapCategoryResponseToForm(category)))
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        setLoadError({
          message: getApiErrorMessage(error),
          status: getApiErrorStatus(error),
        })
      } finally {
        if (!controller.signal.aborted) setIsInitialLoading(false)
      }
    }

    void loadCategory()
    return () => controller.abort()
  }, [id, isEditing, loadAttempt, reset])

  function goBack() {
    navigate('/admin/categories')
  }

  async function onSubmit(values: AddProductCategoryRequest) {
    setIsSaving(true)
    try {
      const payload: AddProductCategoryRequest = {
        name: values.name,
        description: values.description,
        imageUrl: values.imageUrl,
        displayOrder: values.displayOrder,
        isFeatured: values.isFeatured,
        isActive: values.isActive,
      }

      const response = isEditing && isValidGuid(id)
        ? await productCategoryApi.update(id, payload)
        : await productCategoryApi.add(payload)

      if (!mountedRef.current) return

      const routeState: ProductCategoryListRouteState | undefined = isEditing
        ? undefined
        : { createdCategoryId: response.data ?? '' }

      dialog.success(response.message, {
        title: isEditing ? 'Category Updated' : 'Category Created',
        actionLabel: 'Back to Categories',
        onAction: () => navigate('/admin/categories', { state: routeState }),
      })
    } catch (error: unknown) {
      if (!mountedRef.current) return
      dialog.error(getApiErrorMessage(error), {
        title: isEditing ? 'Could Not Update Category' : 'Could Not Create Category',
      })
    } finally {
      if (mountedRef.current) setIsSaving(false)
    }
  }

  function onInvalid() {
    dialog.error(
      'Some category details are incomplete or invalid. Please fix the highlighted fields.',
      { title: 'Cannot Create Category' },
    )
  }

  if (isInitialLoading) return <CategoryFormSkeleton />

  if (loadError) {
    const isNotFound = loadError.status === 404
    return (
      <EntityFormError
        title={isNotFound ? 'Category Not Found' : 'Unable to Load Category'}
        message={isNotFound ? 'The requested category does not exist.' : loadError.message}
        onBack={goBack}
        onRetry={loadError.status === 400 ? undefined : () => setLoadAttempt((value) => value + 1)}
      />
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink-soft hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Back to categories"
        >
          <ArrowLeft size={16} aria-hidden />
        </button>
        <div>
          <h1 className="font-display text-2xl">{isEditing ? 'Edit Category' : 'New Category'}</h1>
          <p className="text-sm text-ink-soft">
            {isEditing
              ? 'Update this category without changing its creation history.'
              : 'Create a new category for organizing your product catalog.'}
          </p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        noValidate
        aria-busy={isBusy}
        className="space-y-4"
      >
        <div
          className={cn(
            'rounded-card border border-ink/10 bg-ivory px-5 py-6 shadow-sm transition-opacity md:px-8 md:py-8',
            isBusy && 'opacity-90',
          )}
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
          <Button type="button" variant="outline" onClick={goBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={isBusy} className="min-w-40">
            {isBusy ? (
              <><LoaderCircle size={15} className="animate-spin" aria-hidden /> {isEditing ? 'Updating...' : 'Creating Category...'}</>
            ) : (
              <><Save size={15} aria-hidden /> {isEditing ? 'Update Category' : 'Create Category'}</>
            )}
          </Button>
        </div>
      </form>

      <MessageDialog {...dialog.props} />
    </div>
  )
}
