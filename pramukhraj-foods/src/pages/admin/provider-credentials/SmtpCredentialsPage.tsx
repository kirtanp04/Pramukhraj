import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, LoaderCircle, Mail, Save, ShieldCheck } from 'lucide-react'
import { ProviderCredentialFormSkeleton } from '@/components/admin/provider-credentials/ProviderCredentialFormSkeleton'
import { EntityFormError } from '@/components/admin/EntityFormError'
import { FormField, inputCls } from '@/components/admin/product/FormField'
import { Button } from '@/components/ui/Button'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useSmtpCredentials } from '@/hooks/provider-credentials/useSmtpCredentials'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/apiClient'
import { DEFAULT_SMTP_CREDENTIALS, smtpCredentialsSchema, type SmtpCredentialsFormValues } from '@/types/providerCredentialsSchema'

export function SmtpCredentialsPage() {
  const dialog = useMessageDialog()
  const { data, isConfigured, isLoading, isSaving, loadError, retry, save } = useSmtpCredentials()
  const form = useForm<SmtpCredentialsFormValues>({
    resolver: zodResolver(smtpCredentialsSchema), defaultValues: DEFAULT_SMTP_CREDENTIALS, mode: 'onChange',
  })
  const { register, reset, setError, formState: { errors, isDirty, isSubmitting } } = form
  const isBusy = isSaving || isSubmitting

  useEffect(() => {
    if (!data) { reset(DEFAULT_SMTP_CREDENTIALS); return }
    reset(smtpCredentialsSchema.parse(data.credentials))
  }, [data, reset])

  async function onSubmit(values: SmtpCredentialsFormValues) {
    const payload = smtpCredentialsSchema.parse(values)
    try {
      const response = await save(payload)
      reset(payload)
      dialog.success(response.message, { title: isConfigured ? 'SMTP Credentials Updated' : 'SMTP Credentials Added' })
    } catch (error) {
      const validationErrors = getApiValidationErrors(error)
      const message = validationErrors.Credentials?.[0] ?? validationErrors.credentials?.[0]
      if (message) setError('host', { type: 'server', message })
      dialog.error(getApiErrorMessage(error), { title: 'Could Not Save SMTP Credentials' })
    }
  }

  if (isLoading) return <ProviderCredentialFormSkeleton label="Loading SMTP credentials" />
  if (loadError) return <EntityFormError title="Unable to Load SMTP Credentials" message={loadError.message} onBack={() => window.history.back()} onRetry={() => void retry()} />

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate aria-busy={isBusy} className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl! text-ink">Email (SMTP)</h1>
            <span className={`rounded-full px-2.5 py-1 text-[11px]! font-semibold ${isConfigured ? 'bg-teal/10 text-teal' : 'bg-turmeric/20 text-ink'}`}>{isConfigured ? 'Configured' : 'Not configured'}</span>
          </div>
          <p className="mt-1 text-sm! text-ink-soft">Securely configure the mailbox used for transactional customer email.</p>
        </div>
        <Button type="submit" disabled={isBusy || !isDirty} className="min-w-40 self-end sm:self-auto">
          {isBusy ? <><LoaderCircle size={15} className="animate-spin" aria-hidden /> Saving...</> : <><Save size={15} aria-hidden /> {isConfigured ? 'Save Changes' : 'Add Credentials'}</>}
        </Button>
      </div>

      <section className="overflow-hidden rounded-card border border-ink/10 bg-ivory" aria-labelledby="smtp-heading">
        <div className="flex items-start gap-3 border-b border-ink/10 bg-ivory-dim px-4 py-4 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-oxblood/8 text-oxblood"><Mail size={20} aria-hidden /></span>
          <div><h2 id="smtp-heading" className="font-display text-lg! text-ink">SMTP Provider Details</h2><p className="text-xs! text-ink-soft">All values are required and encrypted before storage.</p></div>
        </div>
        <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
          <FormField label="SMTP Host" htmlFor="smtp-host" error={errors.host?.message} required><input id="smtp-host" autoComplete="off" placeholder="smtp.gmail.com" disabled={isBusy} {...register('host')} className={inputCls(!!errors.host)} /></FormField>
          <FormField label="Port" htmlFor="smtp-port" error={errors.port?.message} hint="587 uses STARTTLS; 465 uses implicit TLS." required><input id="smtp-port" type="number" inputMode="numeric" min={1} max={65535} placeholder="587" disabled={isBusy} {...register('port', { valueAsNumber: true })} className={inputCls(!!errors.port)} /></FormField>
          <FormField label="Sender Name" htmlFor="smtp-sender-name" error={errors.senderName?.message} required><input id="smtp-sender-name" autoComplete="organization" placeholder="Pramukhraj Foods" disabled={isBusy} {...register('senderName')} className={inputCls(!!errors.senderName)} /></FormField>
          <FormField label="Sender Email" htmlFor="smtp-sender-email" error={errors.senderEmail?.message} required><input id="smtp-sender-email" type="email" autoComplete="email" placeholder="yourname@gmail.com" disabled={isBusy} {...register('senderEmail')} className={inputCls(!!errors.senderEmail)} /></FormField>
          <FormField label="Username" htmlFor="smtp-username" error={errors.username?.message} hint="Usually the full mailbox email address." required><input id="smtp-username" type="email" autoComplete="username" placeholder="yourname@gmail.com" disabled={isBusy} {...register('username')} className={inputCls(!!errors.username)} /></FormField>
          <FormField label="App Password" htmlFor="smtp-password" error={errors.password?.message} hint="For Gmail, use a 16-character app password—not your account password." required><input id="smtp-password" type="password" autoComplete="new-password" placeholder="Enter the SMTP app password" disabled={isBusy} {...register('password')} className={inputCls(!!errors.password)} /></FormField>
        </div>
      </section>

      <aside className="flex items-start gap-3 rounded-card border border-teal/15 bg-teal/5 p-4 text-sm! text-ink-soft">
        <ShieldCheck size={19} className="mt-0.5 shrink-0 text-teal" aria-hidden />
        <div><p className="font-medium text-ink">Secure delivery</p><p className="mt-0.5 text-xs! leading-relaxed">Credentials are encrypted at rest. Email delivery requires TLS and certificate validation; recipient addresses are never written to error logs.</p></div>
        <KeyRound size={17} className="ml-auto hidden shrink-0 text-teal/60 sm:block" aria-hidden />
      </aside>
      <MessageDialog {...dialog.props} />
    </form>
  )
}
