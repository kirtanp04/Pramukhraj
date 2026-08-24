import { useEffect, useState, type MouseEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, LoaderCircle, Save } from 'lucide-react'
import { productSchema, type ProductFormValues, STEP_FIELDS } from '@/types/productSchema'

import { ProductFormStepper } from '@/components/admin/product/ProductFormStepper'
import { Step1BasicInfo } from '@/components/admin/product/Step1BasicInfo'
import { Step2Details } from '@/components/admin/product/Step2Details'
import { Step3Variants } from '@/components/admin/product/Step3Variants'
import { Step4Tags } from '@/components/admin/product/Step4Tags'
import { Step5Images } from '@/components/admin/product/Step5Images'
import { Step6Review } from '@/components/admin/product/Step6Review'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { useProductCategories } from '@/hooks/useProductCategories'

import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiClient'
import { PRODUCT_FORM_STEPS } from '@/model/Product'
import { productApi } from '@/services/productApi'

// ─── Default values matching the Product class defaults ───────────────────────
const DEFAULT_VALUES: ProductFormValues = {
  categoryId: '',
  name: '',
  shortDescription: '',
  description: '',
  brand: 'Pramukhraj',
  isFeatured: false,
  isBestSeller: false,
  isTrending: false,
  isNewArrival: false,
  isActive: true,
  countryOfOrigin: 'India',
  isVegetarian: true,
  shelfLife: '',
  storageInstruction: '',
  ingredients: '',
  nutritionalInformation: '',
  barcode: null,
  variants: [],
  tags: [],
  images: [],
}

const TOTAL_STEPS = PRODUCT_FORM_STEPS.length

export function ProductFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEditing = !!id
  const navigate = useNavigate()
  const dialog = useMessageDialog()
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    retry: retryCategories,
  } = useProductCategories()

  const [currentStep, setCurrentStep] = useState(1)
  const [maxVisitedStep, setMaxVisitedStep] = useState(1)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  })

  const { formState: { errors, isSubmitting } } = form
  const categoryStepBlocked = currentStep === 1 && (
    categoriesLoading || !!categoriesError || categories.length === 0
  )

  // Track which steps have errors for the stepper indicator
  const stepsWithErrors = PRODUCT_FORM_STEPS.map((s) => s.id).filter((id) => {
    const fields = STEP_FIELDS[id] as (keyof ProductFormValues)[]
    return fields.some((f) => !!errors[f])
  })

  // TODO: When editing, fetch product by `id` and reset form
  useEffect(() => {
    if (isEditing && id) {
      // fetch(`/api/products/${id}`) then form.reset(mapped data)
    }
  }, [id, isEditing])

  // ─── Step navigation ────────────────────────────────────────────────────────

  async function goToStep(target: number) {
    if (isSubmitting) return

    if (target > currentStep) {
      // Validate current step fields before advancing
      const fieldsToValidate = STEP_FIELDS[currentStep] as (keyof ProductFormValues)[]
      if (fieldsToValidate.length > 0) {
        const valid = await form.trigger(fieldsToValidate)
        if (!valid) return
      }
    }
    setCurrentStep(target)
    setMaxVisitedStep((prev) => Math.max(prev, target))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleNext(event: MouseEvent<HTMLButtonElement>) {
    // Validation is asynchronous. Prevent the browser's default click action
    // before React replaces this button with the final submit button.
    event.preventDefault()
    await goToStep(currentStep + 1)
  }

  function handleBack() {
    goToStep(currentStep - 1)
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  async function onSubmit(values: ProductFormValues) {
    if (isEditing) {
      dialog.error('Product updates are not connected yet.', {
        title: 'Update Unavailable',
      })
      return
    }

    try {
      await productApi.add(values)

      dialog.success(
        'Product created successfully.',
        {
          title: 'Product Created',
          actionLabel: 'Back to Products',
          onAction: () => navigate('/admin/products'),
        },
      )
    } catch (err: unknown) {
      dialog.error(getApiErrorMessage(err), {
        title: 'Could Not Create Product',
      })
    }
  }

  function handleFormError() {
    // Trigger validation on all fields to surface all errors at once
    form.trigger()
    dialog.error(
      'Some fields are incomplete or invalid. Please review each step and fix the highlighted errors.',
      { title: 'Cannot Save Yet' },
    )
  }

  // ─── Step render ────────────────────────────────────────────────────────────

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            form={form}
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoriesError={categoriesError}
            onRetryCategories={() => void retryCategories()}
          />
        )
      case 2: return <Step2Details form={form} />
      case 3: return <Step3Variants form={form} />
      case 4: return <Step4Tags form={form} />
      case 5: return <Step5Images form={form} />
      case 6: return <Step6Review form={form} categories={categories} />
      default: return null
    }
  }

  const isLastStep = currentStep === TOTAL_STEPS

  return (
    <div className="mx-auto max-w-5xl">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => navigate('/admin/products')}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink-soft hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Back to products"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-display text-2xl">
            {isEditing ? 'Edit Product' : 'New Product'}
          </h1>
          <p className="text-sm text-ink-soft">
            {isEditing
              ? `Editing product ID: ${id}`
              : 'Fill in each step to create a new product listing.'}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-6 rounded-card border border-ink/10 bg-ivory px-5 py-4">
        <ProductFormStepper
          steps={PRODUCT_FORM_STEPS}
          currentStep={currentStep}
          stepsWithErrors={stepsWithErrors}
          maxVisitedStep={maxVisitedStep}
          onStepClick={goToStep}
          disabled={isSubmitting}
        />
      </div>

      {/* Step content card */}
      <form
        onSubmit={form.handleSubmit(onSubmit, handleFormError)}
        noValidate
        aria-busy={isSubmitting}
      >
        <div
          className={cn(
            'rounded-card border border-ink/10 bg-ivory px-5 py-6 transition-opacity md:px-8 md:py-8',
            isSubmitting && 'pointer-events-none opacity-70',
          )}
          aria-disabled={isSubmitting}
        >
          {renderStepContent()}
        </div>

        {/* Navigation footer */}
        <div
          className={cn(
            'mt-4 flex items-center rounded-card border border-ink/10 bg-ivory px-5 py-4',
            currentStep === 1 ? 'justify-end' : 'justify-between',
          )}
        >
          {currentStep > 1 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-full border border-ink/15 px-5 py-2 text-sm text-ink hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft size={15} /> Back
            </button>
          )}

          <div className="flex items-center gap-3">
            {/* Save draft shortcut on any step (skips step validation) */}
            {currentStep < TOTAL_STEPS && (
              <button
                type="button"
                disabled={isSubmitting || categoryStepBlocked}
                onClick={() => goToStep(TOTAL_STEPS)}
                className="text-xs text-ink-soft hover:text-oxblood disabled:cursor-not-allowed disabled:opacity-50"
              >
                Skip to Review
              </button>
            )}

            {!isLastStep ? (
              <button
                key="next-step"
                type="button"
                disabled={isSubmitting || categoryStepBlocked}
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-full bg-oxblood px-5 py-2 text-sm font-medium text-ivory hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next <ArrowRight size={15} />
              </button>
            ) : (
              <button
                key="submit-product"
                type="submit"
                disabled={isSubmitting}
                className="flex min-w-40 items-center justify-center gap-1.5 rounded-full bg-oxblood px-6 py-2 text-sm font-medium text-ivory hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" aria-hidden />
                    <span>{isEditing ? 'Saving Changes...' : 'Creating Product...'}</span>
                  </>
                ) : (
                  <>
                    <Save size={15} aria-hidden />
                    <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Message dialog */}
      <MessageDialog {...dialog.props} />
    </div>
  )
}
