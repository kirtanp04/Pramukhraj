import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, KeyRound, LoaderCircle, Save, ShieldCheck } from 'lucide-react'
import { ProviderCredentialFormSkeleton } from '@/components/admin/provider-credentials/ProviderCredentialFormSkeleton'
import { EntityFormError } from '@/components/admin/EntityFormError'
import { FormField, inputCls, ToggleField } from '@/components/admin/product/FormField'
import { Button } from '@/components/ui/Button'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useRazorpayCredentials } from '@/hooks/provider-credentials/useRazorpayCredentials'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/apiClient'
import {
  DEFAULT_RAZORPAY_CREDENTIALS,
  razorpayCredentialsSchema,
  type RazorpayCredentialsFormValues,
} from '@/types/providerCredentialsSchema'

export function RazorpayCredentialsPage() {
  const dialog = useMessageDialog()
  const { data, isConfigured, isLoading, isSaving, loadError, retry, save } = useRazorpayCredentials()
  const form = useForm<RazorpayCredentialsFormValues>({
    resolver: zodResolver(razorpayCredentialsSchema),
    defaultValues: DEFAULT_RAZORPAY_CREDENTIALS,
    mode: 'onChange',
  })
  const {
    register,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = form
  const isBusy = isSaving || isSubmitting

  useEffect(() => {
    if (!data) {
      reset(DEFAULT_RAZORPAY_CREDENTIALS)
      return
    }

    reset(razorpayCredentialsSchema.parse({
      apiKey: data.credentials.apiKey ?? '',
      keySecret: data.credentials.keySecret ?? '',
      webhookSecret: data.credentials.webhookSecret ?? '',
      isUpiPaymentEnabled: data.credentials.isUpiPaymentEnabled ?? true,
      isCardPaymentEnabled: data.credentials.isCardPaymentEnabled ?? true,
    }))
  }, [data, reset])

  async function onSubmit(values: RazorpayCredentialsFormValues) {
    const payload = razorpayCredentialsSchema.parse(values)
    try {
      const wasConfigured = isConfigured
      const response = await save(payload)
      reset(payload)
      dialog.success(response.message, {
        title: wasConfigured ? 'Razorpay Credentials Updated' : 'Razorpay Credentials Added',
      })
    } catch (error) {
      const validationErrors = getApiValidationErrors(error)
      const credentialMessage = validationErrors.Credentials?.[0] ?? validationErrors.credentials?.[0]
      if (credentialMessage) setError('apiKey', { type: 'server', message: credentialMessage })
      dialog.error(getApiErrorMessage(error), { title: 'Could Not Save Razorpay Credentials' })
    }
  }

  if (isLoading) return <ProviderCredentialFormSkeleton label="Loading Razorpay credentials" />

  if (loadError) {
    return (
      <EntityFormError
        title="Unable to Load Razorpay Credentials"
        message={loadError.message}
        onBack={() => window.history.back()}
        onRetry={() => void retry()}
      />
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      aria-busy={isBusy}
      className="mx-auto max-w-4xl space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl! text-ink">Razorpay</h1>
            <span className={`rounded-full px-2.5 py-1 text-[11px]! font-semibold ${
              isConfigured ? 'bg-teal/10 text-teal' : 'bg-turmeric/20 text-ink'
            }`}>
              {isConfigured ? 'Configured' : 'Not configured'}
            </span>
          </div>
          <p className="mt-1 text-sm! text-ink-soft">Manage credentials used to process and verify Razorpay payments.</p>
        </div>
        <Button type="submit" disabled={isBusy || !isDirty} className="min-w-40 self-end sm:self-auto">
          {isBusy
            ? <><LoaderCircle size={15} className="animate-spin" aria-hidden /> Saving...</>
            : <><Save size={15} aria-hidden /> {isConfigured ? 'Save Changes' : 'Add Credentials'}</>}
        </Button>
      </div>

      <section className="overflow-hidden rounded-card border border-ink/10 bg-ivory" aria-labelledby="razorpay-credentials-heading">
        <div className="flex items-start gap-3 border-b border-ink/10 bg-ivory-dim px-4 py-4 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-oxblood/8 text-oxblood">
            <CreditCard size={20} aria-hidden />
          </span>
          <div>
            <h2 id="razorpay-credentials-heading" className="font-display text-lg! text-ink">Payment Provider Details</h2>
            <p className="text-xs! text-ink-soft">All three values are required and encrypted before storage.</p>
          </div>
        </div>

        <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
          <FormField label="API Key" htmlFor="razorpay-api-key" error={errors.apiKey?.message} required>
            <input
              id="razorpay-api-key"
              autoComplete="off"
              placeholder="rzp_test_xxxxxxxxxxxx"
              disabled={isBusy}
              {...register('apiKey')}
              className={inputCls(!!errors.apiKey)}
            />
          </FormField>
          <FormField label="Key Secret" htmlFor="razorpay-key-secret" error={errors.keySecret?.message} required>
            <input
              id="razorpay-key-secret"
              type="password"
              autoComplete="new-password"
              placeholder="Enter the Razorpay key secret"
              disabled={isBusy}
              {...register('keySecret')}
              className={inputCls(!!errors.keySecret)}
            />
          </FormField>
          <FormField label="Webhook Secret" htmlFor="razorpay-webhook-secret" error={errors.webhookSecret?.message} required>
            <input
              id="razorpay-webhook-secret"
              type="password"
              autoComplete="new-password"
              placeholder="Enter the Razorpay webhook secret"
              disabled={isBusy}
              {...register('webhookSecret')}
              className={inputCls(!!errors.webhookSecret)}
            />
          </FormField>
        </div>

        <div className="border-t border-ink/10 p-4 sm:p-6">
          <div className="mb-4">
            <h3 className="font-display text-lg! text-ink">Accepted payment methods</h3>
            <p className="mt-1 text-xs! text-ink-soft">Enable at least one method. Customers will only see the enabled methods in Razorpay Checkout.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              label="UPI payments"
              description="Allow UPI apps and UPI QR payments."
              checked={watch('isUpiPaymentEnabled')}
              onCheckedChange={value => setValue('isUpiPaymentEnabled', value, { shouldDirty: true, shouldValidate: true })}
              disabled={isBusy}
            />
            <ToggleField
              label="Card payments"
              description="Allow supported debit and credit cards."
              checked={watch('isCardPaymentEnabled')}
              onCheckedChange={value => setValue('isCardPaymentEnabled', value, { shouldDirty: true, shouldValidate: true })}
              disabled={isBusy}
            />
          </div>
          {errors.isUpiPaymentEnabled && <p className="mt-3 text-[11px]! font-medium text-oxblood" role="alert">{errors.isUpiPaymentEnabled.message}</p>}
        </div>
      </section>

      <aside className="flex items-start gap-3 rounded-card border border-teal/15 bg-teal/5 p-4 text-sm! text-ink-soft">
        <ShieldCheck size={19} className="mt-0.5 shrink-0 text-teal" aria-hidden />
        <div>
          <p className="font-medium text-ink">Credential security</p>
          <p className="mt-0.5 text-xs! leading-relaxed">Only administrators can access this page. Secret values are sent through the protected API and encrypted at rest.</p>
        </div>
        <KeyRound size={17} className="ml-auto hidden shrink-0 text-teal/60 sm:block" aria-hidden />
      </aside>

      <MessageDialog {...dialog.props} />
    </form>
  )
}
