import { useEffect, useState } from 'react'
import { Controller, useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as Switch from '@radix-ui/react-switch'
import { AlertCircle, Eye, LoaderCircle, RefreshCw, Save, X } from 'lucide-react'
import { HomepageCmsFormSkeleton } from '@/components/admin/homepage-cms/HomepageCmsFormSkeleton'
import { HomepageHeroImageUploader } from '@/components/admin/homepage-cms/HomepageHeroImageUploader'
import { FormField, inputCls } from '@/components/admin/product/FormField'
import { Hero } from '@/components/storefront/Hero'
import { Button } from '@/components/ui/Button'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useAdminHomepageCms } from '@/hooks/homepage-cms/useAdminHomepageCms'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/apiClient'
import { cn } from '@/lib/utils'
import type { HomepageCmsWriteRequest } from '@/types/homepageCms'
import { DEFAULT_HOMEPAGE_CMS_VALUES, homepageCmsSchema } from '@/types/homepageCmsSchema'

type VisibilityField = FieldPath<Pick<
  HomepageCmsWriteRequest,
  | 'showShopByCategory'
  | 'showFeaturedProducts'
  | 'showTrendingProducts'
  | 'showBestSellerProducts'
  | 'showNewArrivalProducts'
  | 'showCustomerTestimonials'
  | 'showFaqSection'
>>

const visibilityFields: { name: VisibilityField; label: string }[] = [
  // { name: 'showShopByCategory', label: 'Shop by Category' },
  { name: 'showFeaturedProducts', label: 'Featured Products' },
  { name: 'showTrendingProducts', label: 'Trending Now' },
  { name: 'showBestSellerProducts', label: 'Best Sellers' },
  { name: 'showNewArrivalProducts', label: 'New Arrivals' },
  { name: 'showCustomerTestimonials', label: 'Customer Testimonials' },
  { name: 'showFaqSection', label: 'FAQ' },
]

export function AdminCMS() {
  const canManage = true
  const dialog = useMessageDialog()
  const { data, isLoading, isSaving, loadError, retry, save } = useAdminHomepageCms()
  const [showPreview, setShowPreview] = useState(false)

  const form = useForm<HomepageCmsWriteRequest>({
    resolver: zodResolver(homepageCmsSchema),
    defaultValues: DEFAULT_HOMEPAGE_CMS_VALUES,
    mode: 'onChange',
  })

  const {
    register,
    control,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = form
  const values = watch()
  const isBusy = isSubmitting || isSaving

  useEffect(() => {
    if (!data) return
    reset(homepageCmsSchema.parse({
      eyebrowBadge: data.eyebrowBadge,
      headline: data.headline,
      subtext: data.subtext,
      heroImageBase64: data.heroImageBase64 ?? '',
      heroImageAltText: data.heroImageAltText,
      happyCustomersCount: data.happyCustomersCount ?? '',
      happyCustomersLabel: data.happyCustomersLabel ?? '',
      productCount: data.productCount ?? '',
      productCountLabel: data.productCountLabel ?? '',
      averageRating: data.averageRating ?? '',
      averageRatingLabel: data.averageRatingLabel ?? '',
      showShopByCategory: data.showShopByCategory,
      showFeaturedProducts: data.showFeaturedProducts,
      showTrendingProducts: data.showTrendingProducts,
      showBestSellerProducts: data.showBestSellerProducts,
      showNewArrivalProducts: data.showNewArrivalProducts,
      showCustomerTestimonials: data.showCustomerTestimonials,
      showFaqSection: data.showFaqSection,
    }))
  }, [data, reset])

  async function onSubmit(payload: HomepageCmsWriteRequest) {
    try {
      const response = await save(payload)
      reset(payload)
      dialog.success(response.message, { title: 'Homepage Published' })
    } catch (error) {
      const validationErrors = getApiValidationErrors(error)
      for (const [field, messages] of Object.entries(validationErrors)) {
        const normalizedField = `${field.charAt(0).toLowerCase()}${field.slice(1)}` as keyof HomepageCmsWriteRequest
        if (normalizedField in DEFAULT_HOMEPAGE_CMS_VALUES && messages[0]) {
          setError(normalizedField, { type: 'server', message: messages[0] })
        }
      }
      dialog.error(getApiErrorMessage(error), { title: 'Could Not Publish Homepage' })
    }
  }

  if (isLoading) return <HomepageCmsFormSkeleton />

  if (loadError) {
    return (
      <div className="mx-auto flex min-h-96 max-w-3xl flex-col items-center justify-center rounded-card border border-dashed border-oxblood/25 bg-ivory px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-oxblood/8 text-oxblood">
          <AlertCircle size={24} aria-hidden />
        </span>
        <h1 className="mt-4 font-display text-xl">Unable to Load Homepage CMS</h1>
        <p className="mt-2 max-w-md text-sm text-ink-soft">{loadError.message}</p>
        <Button type="button" className="mt-6" onClick={() => void retry()}>
          <RefreshCw size={15} /> Retry
        </Button>
      </div>
    )
  }

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-ivory text-ink">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-ink/10 bg-ivory/95 px-4 py-3 backdrop-blur md:px-6">
          <div>
            <p className="font-display text-lg">Hero Preview</p>
            <p className="text-xs text-ink-soft">Unpublished homepage content</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setShowPreview(false)}>
            <X size={15} /> Close Preview
          </Button>
        </div>
        <div
          onClickCapture={event => {
            if ((event.target as HTMLElement).closest('a')) event.preventDefault()
          }}
        >
          <Hero
            badge={values.eyebrowBadge}
            headline={values.headline}
            subtext={values.subtext}
            imageSrc={values.heroImageBase64 || undefined}
            imageAlt={values.heroImageAltText}
            happyCustomersCount={values.happyCustomersCount}
            happyCustomersLabel={values.happyCustomersLabel}
            productCount={values.productCount}
            productCountLabel={values.productCountLabel}
            averageRating={values.averageRating}
            averageRatingLabel={values.averageRatingLabel}
          />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate aria-busy={isBusy} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl">Homepage CMS</h1>
          <p className="text-sm text-ink-soft">Edit the hero content and toggle homepage sections.</p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
            <Eye size={15} /> Preview
          </Button>
          {canManage && (
            <Button type="submit" disabled={isBusy || !isDirty} className="min-w-40">
              {isBusy
                ? <><LoaderCircle size={15} className="animate-spin" /> Publishing...</>
                : <><Save size={15} /> Publish Changes</>}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="space-y-5 rounded-card border border-ink/10 bg-ivory p-5" aria-labelledby="hero-section-heading">
          <div>
            <h2 id="hero-section-heading" className="font-display text-lg">Hero Section</h2>
            <p className="text-xs text-ink-soft">Content shown at the top of the customer homepage.</p>
          </div>

          <FormField label="Eyebrow Badge" htmlFor="homepage-eyebrow" error={errors.eyebrowBadge?.message} required>
            <input id="homepage-eyebrow" maxLength={150} disabled={!canManage || isBusy} {...register('eyebrowBadge')} className={inputCls(!!errors.eyebrowBadge)} />
          </FormField>
          <FormField label="Headline" htmlFor="homepage-headline" error={errors.headline?.message} required>
            <textarea id="homepage-headline" maxLength={250} rows={2} disabled={!canManage || isBusy} {...register('headline')} className={cn(inputCls(!!errors.headline), 'resize-y')} />
          </FormField>
          <FormField label="Subtext" htmlFor="homepage-subtext" error={errors.subtext?.message} required>
            <textarea id="homepage-subtext" maxLength={1000} rows={4} disabled={!canManage || isBusy} {...register('subtext')} className={cn(inputCls(!!errors.subtext), 'resize-y')} />
          </FormField>
          <fieldset className="grid gap-4 rounded-lg border border-ink/10 bg-ivory-dim p-4 sm:grid-cols-3">
            <legend className="px-1 text-xs font-medium text-ink-soft">Hero Statistics</legend>
            <div className="space-y-3 rounded-md border border-ink/10 bg-ivory p-3">
              <p className="text-xs font-medium text-ink-soft">Statistic 1</p>
              <FormField label="Value" htmlFor="homepage-happy-customers" error={errors.happyCustomersCount?.message}>
                <input id="homepage-happy-customers" maxLength={30} placeholder="40k+" disabled={!canManage || isBusy} {...register('happyCustomersCount')} className={inputCls(!!errors.happyCustomersCount)} />
              </FormField>
              <FormField label="Label" htmlFor="homepage-happy-customers-label" error={errors.happyCustomersLabel?.message} hint="Both fields blank hides this statistic.">
                <input id="homepage-happy-customers-label" maxLength={60} placeholder="Happy customers" disabled={!canManage || isBusy} {...register('happyCustomersLabel')} className={inputCls(!!errors.happyCustomersLabel)} />
              </FormField>
            </div>
            <div className="space-y-3 rounded-md border border-ink/10 bg-ivory p-3">
              <p className="text-xs font-medium text-ink-soft">Statistic 2</p>
              <FormField label="Value" htmlFor="homepage-product-count" error={errors.productCount?.message}>
                <input id="homepage-product-count" maxLength={30} placeholder="200+" disabled={!canManage || isBusy} {...register('productCount')} className={inputCls(!!errors.productCount)} />
              </FormField>
              <FormField label="Label" htmlFor="homepage-product-count-label" error={errors.productCountLabel?.message} hint="Both fields blank hides this statistic.">
                <input id="homepage-product-count-label" maxLength={60} placeholder="Products" disabled={!canManage || isBusy} {...register('productCountLabel')} className={inputCls(!!errors.productCountLabel)} />
              </FormField>
            </div>
            <div className="space-y-3 rounded-md border border-ink/10 bg-ivory p-3">
              <p className="text-xs font-medium text-ink-soft">Statistic 3</p>
              <FormField label="Value" htmlFor="homepage-average-rating" error={errors.averageRating?.message}>
                <input id="homepage-average-rating" maxLength={30} placeholder="4.7★" disabled={!canManage || isBusy} {...register('averageRating')} className={inputCls(!!errors.averageRating)} />
              </FormField>
              <FormField label="Label" htmlFor="homepage-average-rating-label" error={errors.averageRatingLabel?.message} hint="Both fields blank hides this statistic.">
                <input id="homepage-average-rating-label" maxLength={60} placeholder="Average rating" disabled={!canManage || isBusy} {...register('averageRatingLabel')} className={inputCls(!!errors.averageRatingLabel)} />
              </FormField>
            </div>
          </fieldset>
          <FormField label="Hero Image Alt Text" htmlFor="homepage-image-alt" error={errors.heroImageAltText?.message} hint="Required for accessibility and SEO." required>
            <input id="homepage-image-alt" maxLength={250} disabled={!canManage || isBusy} {...register('heroImageAltText')} className={inputCls(!!errors.heroImageAltText)} />
          </FormField>
          <Controller
            name="heroImageBase64"
            control={control}
            render={({ field }) => (
              <HomepageHeroImageUploader
                value={field.value}
                altText={values.heroImageAltText}
                error={errors.heroImageBase64?.message}
                disabled={!canManage || isBusy}
                onChange={field.onChange}
              />
            )}
          />
        </section>

        <section className="rounded-card border border-ink/10 bg-ivory p-5" aria-labelledby="visibility-heading">
          <h2 id="visibility-heading" className="font-display text-lg">Section Visibility</h2>
          <p className="mb-4 text-xs text-ink-soft">Choose which homepage sections are enabled.</p>
          <div className="divide-y divide-ink/10">
            {visibilityFields.map(item => (
              <Controller
                key={item.name}
                name={item.name}
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm">{item.label}</span>
                    <Switch.Root
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!canManage || isBusy}
                      aria-label={`Show ${item.label}`}
                      className={cn('relative h-5 w-9 rounded-full transition-colors', field.value ? 'bg-oxblood' : 'bg-ink/15')}
                    >
                      <Switch.Thumb className={cn('block h-4 w-4 translate-x-0.5 rounded-full bg-ivory transition-transform', field.value && 'translate-x-[18px]')} />
                    </Switch.Root>
                  </div>
                )}
              />
            ))}
          </div>
        </section>
      </div>

      <MessageDialog {...dialog.props} />
    </form>
  )
}
