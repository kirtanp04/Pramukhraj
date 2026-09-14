import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, LoaderCircle, MessageSquareText, Save, ShieldCheck } from 'lucide-react'
import { ProviderCredentialFormSkeleton } from '@/components/admin/provider-credentials/ProviderCredentialFormSkeleton'
import { FormField, inputCls } from '@/components/admin/product/FormField'
import { EntityFormError } from '@/components/admin/EntityFormError'
import { Button } from '@/components/ui/Button'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useTwilioCredentials } from '@/hooks/provider-credentials/useTwilioCredentials'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/apiClient'
import {
  DEFAULT_TWILIO_CREDENTIALS,
  twilioCredentialsSchema,
  type TwilioCredentialsFormValues,
} from '@/types/providerCredentialsSchema'

export function TwilioCredentialsPage() {
  const dialog = useMessageDialog()
  const { data, isConfigured, isLoading, isSaving, loadError, retry, save } = useTwilioCredentials()
  const form = useForm<TwilioCredentialsFormValues>({
    resolver: zodResolver(twilioCredentialsSchema),
    defaultValues: DEFAULT_TWILIO_CREDENTIALS,
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
      reset(DEFAULT_TWILIO_CREDENTIALS)
      return
    }
    reset(twilioCredentialsSchema.parse({
      accountSid: data.credentials.accountSid ?? '',
      authToken: data.credentials.authToken ?? '',
      fromNumber: data.credentials.fromNumber ?? '',
      serviceId: data.credentials.serviceId ?? '',
    }))
  }, [data, reset])

  async function onSubmit(values: TwilioCredentialsFormValues) {
    const payload = twilioCredentialsSchema.parse(values)
    try {
      const response = await save(payload)
      reset(payload)
      dialog.success(response.message, {
        title: isConfigured ? 'Twilio Credentials Updated' : 'Twilio Credentials Added',
      })
    } catch (error) {
      const validationErrors = getApiValidationErrors(error)
      const credentialMessage = validationErrors.Credentials?.[0] ?? validationErrors.credentials?.[0]
      if (credentialMessage) setError('accountSid', { type: 'server', message: credentialMessage })
      dialog.error(getApiErrorMessage(error), { title: 'Could Not Save Twilio Credentials' })
    }
  }

  if (isLoading) return <ProviderCredentialFormSkeleton />

  if (loadError) {
    return (
      <EntityFormError
        title="Unable to Load Twilio Credentials"
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
            <h1 className="font-display text-2xl text-ink">Twilio (SMS)</h1>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isConfigured ? 'bg-teal/10 text-teal' : 'bg-turmeric/20 text-ink'
            }`}>
              {isConfigured ? 'Configured' : 'Not configured'}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">Manage the credentials used to deliver customer SMS messages.</p>
        </div>
        <Button type="submit" disabled={isBusy || !isDirty} className="min-w-40 self-end sm:self-auto">
          {isBusy
            ? <><LoaderCircle size={15} className="animate-spin" aria-hidden /> Saving...</>
            : <><Save size={15} aria-hidden /> {isConfigured ? 'Save Changes' : 'Add Credentials'}</>}
        </Button>
      </div>

      <section className="overflow-hidden rounded-card border border-ink/10 bg-ivory" aria-labelledby="twilio-credentials-heading">
        <div className="flex items-start gap-3 border-b border-ink/10 bg-ivory-dim px-4 py-4 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-oxblood/8 text-oxblood">
            <MessageSquareText size={20} aria-hidden />
          </span>
          <div>
            <h2 id="twilio-credentials-heading" className="font-display text-lg text-ink">SMS Provider Details</h2>
            <p className="text-xs text-ink-soft">Values are encrypted before they are stored.</p>
          </div>
        </div>

        <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
          <FormField label="Account SID" htmlFor="twilio-account-sid" error={errors.accountSid?.message} required>
            <input
              id="twilio-account-sid"
              autoComplete="off"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={isBusy}
              {...register('accountSid')}
              className={inputCls(!!errors.accountSid)}
            />
          </FormField>
          <FormField label="Auth Token" htmlFor="twilio-auth-token" error={errors.authToken?.message} required>
            <input
              id="twilio-auth-token"
              type="password"
              autoComplete="new-password"
              placeholder="Enter the Twilio auth token"
              disabled={isBusy}
              {...register('authToken')}
              className={inputCls(!!errors.authToken)}
            />
          </FormField>
          <FormField label="From Number" htmlFor="twilio-from-number" error={errors.fromNumber?.message} hint="Use E.164 format, for example +17372508034." required>
            <input
              id="twilio-from-number"
              type="tel"
              autoComplete="tel"
              placeholder="+17372508034"
              disabled={isBusy}
              {...register('fromNumber')}
              className={inputCls(!!errors.fromNumber)}
            />
          </FormField>
          <FormField label="Service ID" htmlFor="twilio-service-id" error={errors.serviceId?.message} hint="Optional Messaging Service SID.">
            <input
              id="twilio-service-id"
              autoComplete="off"
              placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={isBusy}
              {...register('serviceId')}
              className={inputCls(!!errors.serviceId)}
            />
          </FormField>
        </div>
      </section>

      <aside className="flex items-start gap-3 rounded-card border border-teal/15 bg-teal/5 p-4 text-sm text-ink-soft">
        <ShieldCheck size={19} className="mt-0.5 shrink-0 text-teal" aria-hidden />
        <div>
          <p className="font-medium text-ink">Credential security</p>
          <p className="mt-0.5 text-xs leading-relaxed">Only administrators can access this page. Secret values are sent through the protected API and encrypted at rest.</p>
        </div>
        <KeyRound size={17} className="ml-auto hidden shrink-0 text-teal/60 sm:block" aria-hidden />
      </aside>

      <MessageDialog {...dialog.props} />
    </form>
  )
}
