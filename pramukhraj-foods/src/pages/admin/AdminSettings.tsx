import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AlertCircle, LoaderCircle, RefreshCw, Save, Settings2 } from 'lucide-react'
import { FormField, inputCls } from '@/components/admin/product/FormField'
import { Button } from '@/components/ui/Button'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/apiClient'
import { cn } from '@/lib/utils'
import { storeSettingsApi } from '@/features/admin-settings/storeSettingsApi'
import { DEFAULT_STORE_SETTINGS, storeSettingsSchema } from '@/features/admin-settings/storeSettingsSchema'
import type { StoreSettingsFormValues } from '@/features/admin-settings/types'

export function AdminSettings() {
  const dialog = useMessageDialog()
  const mounted = useRef(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const form = useForm<StoreSettingsFormValues>({
    resolver: zodResolver(storeSettingsSchema), defaultValues: DEFAULT_STORE_SETTINGS, mode: 'onChange',
  })
  const { register, reset, setError, formState: { errors, isDirty } } = form

  useEffect(() => () => { mounted.current = false }, [])
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true); setLoadError(null)
      try {
        const settings = await storeSettingsApi.get(controller.signal)
        if (!settings) throw new Error('Store settings were not returned.')
        if (!controller.signal.aborted) reset({
          ...settings,
          taxRatePercent: finiteOrZero(settings.taxRatePercent),
        })
      } catch (error) {
        if (!controller.signal.aborted) setLoadError(getApiErrorMessage(error))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [attempt, reset])

  async function submit(values: StoreSettingsFormValues) {
    setSaving(true)
    try {
      const response = await storeSettingsApi.update(values)
      if (!mounted.current) return
      if (response.data) reset({
        ...response.data,
        taxRatePercent: finiteOrZero(response.data.taxRatePercent),
      })
      dialog.success(response.message, { title: 'Settings Saved' })
    } catch (error) {
      if (!mounted.current) return
      for (const [field, messages] of Object.entries(getApiValidationErrors(error))) {
        const name = `${field.charAt(0).toLowerCase()}${field.slice(1)}` as keyof StoreSettingsFormValues
        if (name in DEFAULT_STORE_SETTINGS && messages[0]) setError(name, { type: 'server', message: messages[0] })
      }
      dialog.error(getApiErrorMessage(error), { title: 'Could Not Save Settings' })
    } finally {
      if (mounted.current) setSaving(false)
    }
  }

  if (loading) return <SettingsSkeleton />
  if (loadError) return (
    <div className="mx-auto max-w-5xl rounded-card border border-red-200 bg-red-50 p-8 text-center">
      <AlertCircle className="mx-auto text-red-700" aria-hidden />
      <h1 className="mt-3 font-display text-xl!">Unable to load settings</h1>
      <p className="mt-1 text-sm! text-ink-soft">{loadError}</p>
      <Button className="mt-5" onClick={() => setAttempt(value => value + 1)}><RefreshCw size={15} /> Retry</Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-oxblood"><Settings2 size={18} aria-hidden /><span className="text-xs! font-semibold uppercase tracking-[0.16em]">Configuration</span></div>
          <h1 className="font-display text-2xl!">Store settings</h1>
          <p className="mt-1 text-sm! text-ink-soft">Manage customer support details and checkout pricing rules.</p>
        </div>
        <Button type="submit" form="store-settings-form" disabled={saving || !isDirty} className="min-w-36">
          {saving ? <><LoaderCircle size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> Save changes</>}
        </Button>
      </div>

      <form id="store-settings-form" onSubmit={form.handleSubmit(submit)} noValidate aria-busy={saving} className="space-y-5">
        <section className={cn('rounded-card border border-ink/10 bg-ivory p-5 shadow-sm md:p-8', saving && 'opacity-90')} aria-labelledby="store-details-heading">
          <h2 id="store-details-heading" className="font-display text-lg! font-semibold">Store & support</h2>
          <p className="mt-1 text-xs! text-ink-soft">These details identify your store and give customers a reliable way to contact you.</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FormField label="Store name" htmlFor="store-name" error={errors.storeName?.message} required>
              <input id="store-name" maxLength={150} {...register('storeName')} className={inputCls(!!errors.storeName)} placeholder="Your store name" />
            </FormField>
            <FormField label="Support email" htmlFor="support-email" error={errors.supportEmail?.message} required>
              <input id="support-email" type="email" maxLength={254} {...register('supportEmail')} className={inputCls(!!errors.supportEmail)} placeholder="support@example.com" autoComplete="email" />
            </FormField>
            <FormField label="Support phone number" htmlFor="support-phone" error={errors.supportPhoneNumber?.message} hint="Use international format without spaces, e.g. +919876543210." required>
              <input id="support-phone" type="tel" maxLength={20} {...register('supportPhoneNumber')} className={inputCls(!!errors.supportPhoneNumber)} placeholder="+919876543210" autoComplete="tel" />
            </FormField>
            <FormField label="Store address" htmlFor="store-address" error={errors.storeAddress?.message} className="md:col-span-2" required>
              <textarea id="store-address" rows={4} maxLength={1000} {...register('storeAddress')} className={cn(inputCls(!!errors.storeAddress), 'resize-y')} placeholder="Full business or dispatch address" />
            </FormField>
          </div>
        </section>

        <section className={cn('rounded-card border border-ink/10 bg-ivory p-5 shadow-sm md:p-8', saving && 'opacity-90')} aria-labelledby="checkout-rules-heading">
          <h2 id="checkout-rules-heading" className="font-display text-lg! font-semibold">Checkout rules</h2>
          <p className="mt-1 text-xs! text-ink-soft">Tax is excluded from product prices and added to the discounted merchandise value during checkout.</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FormField label="Tax rate (%)" htmlFor="tax-rate" error={errors.taxRatePercent?.message} hint="Example: 5 displays as 5% and adds ₹5 tax to a ₹100 taxable amount." required>
              <div className="relative"><input id="tax-rate" type="number" min={0} max={100} step="0.01" {...register('taxRatePercent', { setValueAs: value => value === '' || value === null || value === undefined ? 0 : Number(value) })} className={cn(inputCls(!!errors.taxRatePercent), 'pr-10')} /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm! text-ink-soft">%</span></div>
            </FormField>
            <FormField label="Free shipping minimum (₹)" htmlFor="free-shipping" error={errors.freeShippingMinimumAmount?.message} hint="Applied after coupon discounts. Enter 0 to disable automatic free shipping." required>
              <div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm! text-ink-soft">₹</span><input id="free-shipping" type="number" min={0} max={10000000} step="0.01" {...register('freeShippingMinimumAmount', { valueAsNumber: true })} className={cn(inputCls(!!errors.freeShippingMinimumAmount), 'pl-9')} /></div>
            </FormField>
          </div>
        </section>

        <div className="flex justify-end rounded-card border border-ink/10 bg-ivory px-5 py-4">
          <Button type="submit" disabled={saving || !isDirty} className="w-full sm:w-auto sm:min-w-36">
            {saving ? <><LoaderCircle size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> Save changes</>}
          </Button>
        </div>
      </form>
      <MessageDialog {...dialog.props} />
    </div>
  )
}

function SettingsSkeleton() {
  return <div className="mx-auto max-w-5xl animate-pulse" aria-label="Loading store settings">
    <div className="mb-6 h-16 w-72 rounded-xl bg-ink/10" />
    {[1, 2].map(item => <div key={item} className="mb-5 rounded-card border border-ink/10 bg-ivory p-8"><div className="h-5 w-40 rounded bg-ink/10" /><div className="mt-6 grid gap-5 md:grid-cols-2"><div className="h-20 rounded-xl bg-ink/5" /><div className="h-20 rounded-xl bg-ink/5" /></div></div>)}
  </div>
}

function finiteOrZero(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}
