import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, LoaderCircle, Save, ShieldCheck, Truck } from 'lucide-react'
import { ProviderCredentialFormSkeleton } from '@/components/admin/provider-credentials/ProviderCredentialFormSkeleton'
import { EntityFormError } from '@/components/admin/EntityFormError'
import { FormField, inputCls } from '@/components/admin/product/FormField'
import { Button } from '@/components/ui/Button'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useShiprocketCredentials } from '@/hooks/provider-credentials/useShiprocketCredentials'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/apiClient'
import {
  DEFAULT_SHIPROCKET_CREDENTIALS,
  shiprocketCredentialsSchema,
  type ShiprocketCredentialsFormValues,
} from '@/types/providerCredentialsSchema'

export function ShiprocketCredentialsPage() {
  const dialog = useMessageDialog()
  const { data, isConfigured, isLoading, isSaving, loadError, retry, save } = useShiprocketCredentials()
  const form = useForm<ShiprocketCredentialsFormValues>({
    resolver: zodResolver(shiprocketCredentialsSchema),
    defaultValues: DEFAULT_SHIPROCKET_CREDENTIALS,
    mode: 'onChange',
  })
  const {
    register,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = form
  const isBusy = isSaving || isSubmitting

  useEffect(() => {
    if (!data) {
      reset(DEFAULT_SHIPROCKET_CREDENTIALS)
      return
    }

    reset(shiprocketCredentialsSchema.parse({
      email: data.credentials.email ?? '',
      password: data.credentials.password ?? '',
      webhookSecret: data.credentials.webhookSecret ?? '',
    }))
  }, [data, reset])

  async function onSubmit(values: ShiprocketCredentialsFormValues) {
    const payload = shiprocketCredentialsSchema.parse(values)
    try {
      const wasConfigured = isConfigured
      const response = await save(payload)
      reset(payload)
      dialog.success(response.message, {
        title: wasConfigured ? 'Shiprocket Credentials Updated' : 'Shiprocket Credentials Added',
      })
    } catch (error) {
      const validationErrors = getApiValidationErrors(error)
      const credentialMessage = validationErrors.Credentials?.[0] ?? validationErrors.credentials?.[0]
      if (credentialMessage) setError('email', { type: 'server', message: credentialMessage })
      dialog.error(getApiErrorMessage(error), { title: 'Could Not Save Shiprocket Credentials' })
    }
  }

  if (isLoading) return <ProviderCredentialFormSkeleton label="Loading Shiprocket credentials" />

  if (loadError) {
    return (
      <EntityFormError
        title="Unable to Load Shiprocket Credentials"
        message={loadError.message}
        onBack={() => window.history.back()}
        onRetry={() => void retry()}
      />
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate aria-busy={isBusy} className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl text-ink">Shiprocket</h1>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isConfigured ? 'bg-teal/10 text-teal' : 'bg-turmeric/20 text-ink'}`}>
              {isConfigured ? 'Configured' : 'Not configured'}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">Manage credentials used for Shiprocket shipping and webhook integration.</p>
        </div>
        <Button type="submit" disabled={isBusy || !isDirty} className="min-w-40 self-end sm:self-auto">
          {isBusy
            ? <><LoaderCircle size={15} className="animate-spin" aria-hidden /> Saving...</>
            : <><Save size={15} aria-hidden /> {isConfigured ? 'Save Changes' : 'Add Credentials'}</>}
        </Button>
      </div>

      <section className="overflow-hidden rounded-card border border-ink/10 bg-ivory" aria-labelledby="shiprocket-credentials-heading">
        <div className="flex items-start gap-3 border-b border-ink/10 bg-ivory-dim px-4 py-4 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-oxblood/8 text-oxblood"><Truck size={20} aria-hidden /></span>
          <div>
            <h2 id="shiprocket-credentials-heading" className="font-display text-lg text-ink">Shipping Provider Details</h2>
            <p className="text-xs text-ink-soft">All three values are required and encrypted before storage.</p>
          </div>
        </div>

        <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
          <FormField label="Email" htmlFor="shiprocket-email" error={errors.email?.message} required>
            <input id="shiprocket-email" type="email" autoComplete="off" placeholder="admin@example.com" disabled={isBusy} {...register('email')} className={inputCls(!!errors.email)} />
          </FormField>
          <FormField label="Password" htmlFor="shiprocket-password" error={errors.password?.message} required>
            <input id="shiprocket-password" type="password" autoComplete="new-password" placeholder="Enter the Shiprocket password" disabled={isBusy} {...register('password')} className={inputCls(!!errors.password)} />
          </FormField>
          <FormField label="Webhook Secret" htmlFor="shiprocket-webhook-secret" error={errors.webhookSecret?.message} required>
            <input id="shiprocket-webhook-secret" type="password" autoComplete="new-password" placeholder="Enter the Shiprocket webhook secret" disabled={isBusy} {...register('webhookSecret')} className={inputCls(!!errors.webhookSecret)} />
          </FormField>
        </div>
      </section>

      <aside className="flex items-start gap-3 rounded-card border border-teal/15 bg-teal/5 p-4 text-sm text-ink-soft">
        <ShieldCheck size={19} className="mt-0.5 shrink-0 text-teal" aria-hidden />
        <div><p className="font-medium text-ink">Credential security</p><p className="mt-0.5 text-xs leading-relaxed">Only administrators can access this page. Secret values are sent through the protected API and encrypted at rest.</p></div>
        <KeyRound size={17} className="ml-auto hidden shrink-0 text-teal/60 sm:block" aria-hidden />
      </aside>

      <MessageDialog {...dialog.props} />
    </form>
  )
}
