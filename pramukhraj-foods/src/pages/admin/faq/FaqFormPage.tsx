import { useEffect, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaqFormSkeleton } from '@/components/admin/faq/FaqFormSkeleton'
import { EntityFormError } from '@/components/admin/EntityFormError'
import { FormField, ToggleField, inputCls } from '@/components/admin/product/FormField'
import { Button } from '@/components/ui/Button'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage, getApiErrorStatus, getApiValidationErrors } from '@/lib/apiClient'
import { isValidGuid } from '@/lib/routeParams'
import { cn } from '@/lib/utils'
import { faqApi } from '@/services/faqApi'
import { FAQ_CATEGORY, FAQ_CATEGORY_LABELS, type FaqWriteRequest } from '@/types/faq'
import { DEFAULT_FAQ_VALUES, faqSchema } from '@/types/faqSchema'

export function FaqFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const dialog = useMessageDialog()
  const mountedRef = useRef(true)
  const [isInitialLoading, setIsInitialLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<{ message: string; status?: number } | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)

  const form = useForm<FaqWriteRequest>({
    resolver: zodResolver(faqSchema),
    defaultValues: DEFAULT_FAQ_VALUES,
    mode: 'onChange',
  })

  const {
    register,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form
  const isBusy = isSubmitting || isSaving

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!isEditing) {
      setIsInitialLoading(false)
      setLoadError(null)
      return
    }

    if (!isValidGuid(id)) {
      setIsInitialLoading(false)
      setLoadError({ message: 'The FAQ ID in this URL is invalid.', status: 400 })
      return
    }

    const faqId = id
    const controller = new AbortController()
    async function loadFaq() {
      setIsInitialLoading(true)
      setLoadError(null)
      try {
        const faq = await faqApi.getById(faqId, controller.signal)
        if (!controller.signal.aborted) {
          if (!faq) throw new Error('FAQ not found.')
          reset(faqSchema.parse({
            category: faq.category,
            question: faq.question,
            answer: faq.answer,
            displayOrder: faq.displayOrder,
            isFeatured: faq.isFeatured,
            isActive: faq.isActive,
          }))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError({ message: getApiErrorMessage(error), status: getApiErrorStatus(error) })
        }
      } finally {
        if (!controller.signal.aborted) setIsInitialLoading(false)
      }
    }

    void loadFaq()
    return () => controller.abort()
  }, [id, isEditing, loadAttempt, reset])

  function goBack() {
    navigate('/admin/faqs')
  }

  async function onSubmit(values: FaqWriteRequest) {
    setIsSaving(true)
    try {
      const response = isEditing && isValidGuid(id)
        ? await faqApi.update(id, values)
        : await faqApi.create(values)

      if (!mountedRef.current) return
      dialog.success(response.message, {
        title: isEditing ? 'FAQ Updated' : 'FAQ Created',
        actionLabel: 'Back to FAQs',
        onAction: goBack,
      })
    } catch (error) {
      if (!mountedRef.current) return
      const validationErrors = getApiValidationErrors(error)
      for (const [field, messages] of Object.entries(validationErrors)) {
        const normalizedField = `${field.charAt(0).toLowerCase()}${field.slice(1)}` as keyof FaqWriteRequest
        if (normalizedField in DEFAULT_FAQ_VALUES && messages[0]) {
          setError(normalizedField, { type: 'server', message: messages[0] })
        }
      }
      dialog.error(getApiErrorMessage(error), {
        title: isEditing ? 'Could Not Update FAQ' : 'Could Not Create FAQ',
      })
    } finally {
      if (mountedRef.current) setIsSaving(false)
    }
  }

  if (isInitialLoading) return <FaqFormSkeleton />

  if (loadError) {
    return (
      <EntityFormError
        title={loadError.status === 404 ? 'FAQ Not Found' : 'Unable to Load FAQ'}
        message={loadError.status === 404 ? 'The requested FAQ does not exist.' : loadError.message}
        onBack={goBack}
        onRetry={loadError.status === 400 ? undefined : () => setLoadAttempt(value => value + 1)}
      />
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={isBusy}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink-soft hover:bg-ink/5 disabled:opacity-50"
          aria-label="Back to FAQs"
        >
          <ArrowLeft size={16} aria-hidden />
        </button>
        <div>
          <h1 className="font-display text-2xl">{isEditing ? 'Edit FAQ' : 'New FAQ'}</h1>
          <p className="text-sm text-ink-soft">
            {isEditing ? 'Update this frequently asked question.' : 'Create helpful storefront content for customers.'}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate aria-busy={isBusy} className="space-y-4">
        <div className={cn('rounded-card border border-ink/10 bg-ivory px-5 py-6 shadow-sm md:px-8 md:py-8', isBusy && 'opacity-90')}>
          <section className="grid gap-5 md:grid-cols-2" aria-labelledby="faq-details-heading">
            <div className="md:col-span-2">
              <h2 id="faq-details-heading" className="font-display text-base font-semibold">FAQ Details</h2>
              <p className="text-xs text-ink-soft">Write a concise question and a clear customer-facing answer.</p>
            </div>

            <FormField label="Category" htmlFor="faq-category" error={errors.category?.message} required>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <select id="faq-category" value={field.value} onChange={event => field.onChange(Number(event.target.value))} className={inputCls(!!errors.category)}>
                    {Object.values(FAQ_CATEGORY).map(category => (
                      <option key={category} value={category}>{FAQ_CATEGORY_LABELS[category]}</option>
                    ))}
                  </select>
                )}
              />
            </FormField>

            <FormField label="Display Order" htmlFor="faq-display-order" error={errors.displayOrder?.message} hint="Lower values appear first." required>
              <input id="faq-display-order" type="number" min={0} step={1} {...register('displayOrder', { valueAsNumber: true })} className={inputCls(!!errors.displayOrder)} />
            </FormField>

            <FormField label="Question" htmlFor="faq-question" error={errors.question?.message} className="md:col-span-2" required>
              <textarea id="faq-question" rows={3} maxLength={500} {...register('question')} placeholder="What do customers frequently ask?" className={cn(inputCls(!!errors.question), 'resize-y')} />
            </FormField>

            <FormField label="Answer" htmlFor="faq-answer" error={errors.answer?.message} hint="Maximum 5,000 characters." className="md:col-span-2" required>
              <textarea id="faq-answer" rows={8} maxLength={5000} {...register('answer')} placeholder="Provide a clear and complete answer..." className={cn(inputCls(!!errors.answer), 'resize-y')} />
            </FormField>

            <Controller
              name="isFeatured"
              control={control}
              render={({ field }) => <ToggleField label="Featured on Home" description="Allow this FAQ to appear on the customer homepage." checked={field.value} onCheckedChange={field.onChange} disabled={isBusy} />}
            />
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => <ToggleField label="Active" description="Make this FAQ visible to customers." checked={field.value} onCheckedChange={field.onChange} disabled={isBusy} />}
            />
          </section>
        </div>

        <div className="flex flex-col-reverse gap-3 rounded-card border border-ink/10 bg-ivory px-5 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={goBack} disabled={isBusy}>Cancel</Button>
          <Button type="submit" disabled={isBusy} className="min-w-36">
            {isBusy ? <><LoaderCircle size={15} className="animate-spin" aria-hidden /> Saving...</> : <><Save size={15} aria-hidden /> {isEditing ? 'Update FAQ' : 'Create FAQ'}</>}
          </Button>
        </div>
      </form>

      <MessageDialog {...dialog.props} />
    </div>
  )
}
