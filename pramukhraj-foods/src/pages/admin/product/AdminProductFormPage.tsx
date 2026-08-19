import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
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

import { cn } from '@/lib/utils'
import { PRODUCT_FORM_STEPS } from '@/model/Product'

// ─── Mock categories (replace with real API call) ─────────────────────────────
const CATEGORIES = [
  { id: 'cat-papad', name: 'Papad' },
  { id: 'cat-khakhra', name: 'Khakhra' },
  { id: 'cat-pickles', name: 'Pickles' },
  { id: 'cat-masala', name: 'Masala' },
  { id: 'cat-namkeen', name: 'Namkeen' },
  { id: 'cat-snacks', name: 'Snacks' },
  { id: 'cat-dryfruits', name: 'Dry Fruits' },
  { id: 'cat-sweets', name: 'Sweets' },
]

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

  const [currentStep, setCurrentStep] = useState(1)
  const [maxVisitedStep, setMaxVisitedStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  })

  const { formState: { errors } } = form

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

  async function handleNext() {
    await goToStep(currentStep + 1)
  }

  function handleBack() {
    goToStep(currentStep - 1)
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  async function onSubmit(values: ProductFormValues) {
    setIsSaving(true)
    try {
      console.log(values)
      // TODO: Replace with real API call
      // const res = isEditing
      //   ? await apiPut(`/api/products/${id}`, values)
      //   : await apiPost('/api/products', values)
      await new Promise((r) => setTimeout(r, 1200)) // mock delay

      dialog.success(
        isEditing
          ? 'Product updated successfully.'
          : 'Product created successfully.',
        {
          title: isEditing ? 'Product Updated' : 'Product Created',
          actionLabel: 'Back to Products',
          onAction: () => navigate('/admin/products'),
        },
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      dialog.error(msg, { title: 'Save Failed' })
    } finally {
      setIsSaving(false)
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

  const stepProps = { form, categories: CATEGORIES }

  function renderStepContent() {
    switch (currentStep) {
      case 1: return <Step1BasicInfo {...stepProps} />
      case 2: return <Step2Details {...stepProps} />
      case 3: return <Step3Variants {...stepProps} />
      case 4: return <Step4Tags {...stepProps} />
      case 5: return <Step5Images {...stepProps} />
      case 6: return <Step6Review {...stepProps} />
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
          onClick={() => navigate('/admin/products')}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink-soft hover:bg-ink/5"
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
        />
      </div>

      {/* Step content card */}
      <form
        onSubmit={form.handleSubmit(onSubmit, handleFormError)}
        noValidate
      >
        <div className="rounded-card border border-ink/10 bg-ivory px-5 py-6 md:px-8 md:py-8">
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
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-full border border-ink/15 px-5 py-2 text-sm text-ink hover:bg-ink/5"
            >
              <ArrowLeft size={15} /> Back
            </button>
          )}

          <div className="flex items-center gap-3">
            {/* Save draft shortcut on any step (skips step validation) */}
            {currentStep < TOTAL_STEPS && (
              <button
                type="button"
                onClick={() => goToStep(TOTAL_STEPS)}
                className="text-xs text-ink-soft hover:text-oxblood"
              >
                Skip to Review
              </button>
            )}

            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-full bg-oxblood px-5 py-2 text-sm font-medium text-ivory hover:bg-oxblood-deep"
              >
                Next <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-full bg-oxblood px-6 py-2 text-sm font-medium text-ivory hover:bg-oxblood-deep disabled:opacity-60"
              >
                {/* <ButtonLoader loading={isSaving} loadingText="Saving…"> */}
                  <Save size={15} />
                  {isEditing ? 'Save Changes' : 'Create Product'}
                {/* </ButtonLoader> */}
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
