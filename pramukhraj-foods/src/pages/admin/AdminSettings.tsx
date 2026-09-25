import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AlertCircle, LoaderCircle, MapPin, RefreshCw, RotateCcw, Save, Settings2, ShieldCheck } from 'lucide-react'
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
  const { register, reset, setError, watch, formState: { errors, isDirty } } = form
  const returnWindowDays = watch('returnWindowDays') ?? 0
  const storeName = watch('storeName') ?? ''
  const line1 = watch('storeAddressLine1') ?? ''
  const line2 = watch('storeAddressLine2') ?? ''
  const city = watch('storeCity') ?? ''
  const state = watch('storeState') ?? ''
  const postalCode = watch('storePostalCode') ?? ''
  const country = watch('storeCountry') ?? 'India'

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
          storeAddressLine1: settings.storeAddressLine1 || settings.storeAddress || '',
          storeAddressLine2: settings.storeAddressLine2 || '',
          storeCity: settings.storeCity || '',
          storeState: settings.storeState || '',
          storePostalCode: settings.storePostalCode || '',
          storeCountry: settings.storeCountry || 'India',
          taxRatePercent: finiteOrZero(settings.taxRatePercent),
          paymentServiceTaxRatePercent: finiteOrZero(settings.paymentServiceTaxRatePercent),
          returnWindowDays: finiteOrZero(settings.returnWindowDays),
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
      const l1 = values.storeAddressLine1?.trim() || ''
      const l2 = values.storeAddressLine2?.trim() || ''
      const c = values.storeCity?.trim() || ''
      const s = values.storeState?.trim() || ''
      const pin = values.storePostalCode?.trim() || ''
      const cntry = values.storeCountry?.trim() || 'India'
      const formattedAddress = [l1, l2, c, s ? `${s}${pin ? ` - ${pin}` : ''}` : pin, cntry].filter(Boolean).join(', ')

      const response = await storeSettingsApi.update({
        ...values,
        storeAddressLine1: l1,
        storeAddressLine2: l2,
        storeCity: c,
        storeState: s,
        storePostalCode: pin,
        storeCountry: cntry,
        storeAddress: formattedAddress,
        taxRatePercent: 0,
        paymentServiceTaxRatePercent: finiteOrZero(values.paymentServiceTaxRatePercent),
        returnWindowDays: Math.round(finiteOrZero(values.returnWindowDays)),
      })
      if (!mounted.current) return
      if (response.data) reset({
        ...response.data,
        storeAddressLine1: response.data.storeAddressLine1 || '',
        storeAddressLine2: response.data.storeAddressLine2 || '',
        storeCity: response.data.storeCity || '',
        storeState: response.data.storeState || '',
        storePostalCode: response.data.storePostalCode || '',
        storeCountry: response.data.storeCountry || 'India',
        taxRatePercent: finiteOrZero(response.data.taxRatePercent),
        paymentServiceTaxRatePercent: finiteOrZero(response.data.paymentServiceTaxRatePercent),
        returnWindowDays: finiteOrZero(response.data.returnWindowDays),
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
          <p className="mt-1 text-sm! text-ink-soft">Manage customer support details, checkout pricing, and return policies.</p>
        </div>
        <Button type="submit" form="store-settings-form" disabled={saving || !isDirty} className="min-w-36">
          {saving ? <><LoaderCircle size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> Save changes</>}
        </Button>
      </div>

      <form id="store-settings-form" onSubmit={form.handleSubmit(submit)} noValidate aria-busy={saving} className="space-y-5">
        {/* Section 1: Store & Customer Support */}
        <section className={cn('rounded-card border border-ink/10 bg-ivory p-5 shadow-sm md:p-8', saving && 'opacity-90')} aria-labelledby="store-details-heading">
          <h2 id="store-details-heading" className="font-display text-lg! font-semibold">Store & support</h2>
          <p className="mt-1 text-xs! text-ink-soft">These details identify your store and give customers a reliable way to contact you.</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FormField label="Store name" htmlFor="store-name" error={errors.storeName?.message} className="md:col-span-2" required>
              <input id="store-name" maxLength={150} {...register('storeName')} className={inputCls(!!errors.storeName)} placeholder="Your store name" />
            </FormField>
            <FormField label="Support email" htmlFor="support-email" error={errors.supportEmail?.message} required>
              <input id="support-email" type="email" maxLength={254} {...register('supportEmail')} className={inputCls(!!errors.supportEmail)} placeholder="support@example.com" autoComplete="email" />
            </FormField>
            <FormField label="Support phone number" htmlFor="support-phone" error={errors.supportPhoneNumber?.message} hint="Use international format without spaces, e.g. +919876543210." required>
              <input id="support-phone" type="tel" maxLength={20} {...register('supportPhoneNumber')} className={inputCls(!!errors.supportPhoneNumber)} placeholder="+919876543210" autoComplete="tel" />
            </FormField>
          </div>
        </section>

        {/* Section 2: Dedicated Store & Dispatch Address */}
        <section className={cn('rounded-card border border-ink/10 bg-ivory p-5 shadow-sm md:p-8', saving && 'opacity-90')} aria-labelledby="store-address-heading">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-oxblood" aria-hidden />
            <h2 id="store-address-heading" className="font-display text-lg! font-semibold">Store & dispatch address</h2>
          </div>
          <p className="mt-1 text-xs! text-ink-soft">
            The primary physical facility and warehouse address of your store. Used for courier serviceability, forward shipments, reverse return pickups, order receipts, and customer communications.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FormField label="Address line 1 (Street, Building, Plot / Shop No.)" htmlFor="store-address-line1" error={errors.storeAddressLine1?.message} className="md:col-span-2" required>
              <input id="store-address-line1" maxLength={250} {...register('storeAddressLine1')} className={inputCls(!!errors.storeAddressLine1)} placeholder="e.g. Plot No. 42, GIDC Phase II, Naroda Industrial Estate" />
            </FormField>

            <FormField label="Address line 2 (Apartment, Area, Sector, Landmark)" htmlFor="store-address-line2" error={errors.storeAddressLine2?.message} className="md:col-span-2">
              <input id="store-address-line2" maxLength={250} {...register('storeAddressLine2')} className={inputCls(!!errors.storeAddressLine2)} placeholder="e.g. Near Old Railway Crossing (Optional)" />
            </FormField>

            <FormField label="City" htmlFor="store-city" error={errors.storeCity?.message} required>
              <input id="store-city" maxLength={100} {...register('storeCity')} className={inputCls(!!errors.storeCity)} placeholder="e.g. Ahmedabad" />
            </FormField>

            <FormField label="State" htmlFor="store-state" error={errors.storeState?.message} required>
              <input id="store-state" maxLength={100} {...register('storeState')} className={inputCls(!!errors.storeState)} placeholder="e.g. Gujarat" />
            </FormField>

            <FormField label="PIN / Postal Code" htmlFor="store-postal-code" error={errors.storePostalCode?.message} hint="6-digit Indian PIN code." required>
              <input id="store-postal-code" maxLength={6} {...register('storePostalCode')} className={inputCls(!!errors.storePostalCode)} placeholder="e.g. 382330" />
            </FormField>

            <FormField label="Country" htmlFor="store-country" error={errors.storeCountry?.message} required>
              <input id="store-country" maxLength={100} {...register('storeCountry')} className={inputCls(!!errors.storeCountry)} placeholder="India" />
            </FormField>
          </div>

          {/* Formatted Address Live Preview */}
          <div className="mt-5 rounded-xl border border-teal/20 bg-teal/5 p-4 text-xs! text-teal">
            <span className="font-semibold uppercase tracking-wider text-[11px]! block mb-1">
              Address Preview (As shown on RMA Slips, Order Receipts & Shipping Pickups)
            </span>
            <p className="font-medium text-ink">
              {storeName || 'Store Name'}
            </p>
            <p className="text-ink-soft mt-0.5">
              {[line1, line2].filter(Boolean).join(', ') || 'Address Line 1 & Line 2'}
            </p>
            <p className="text-ink-soft">
              {[city, state ? `${state}${postalCode ? ` - ${postalCode}` : ''}` : postalCode, country].filter(Boolean).join(', ')}
            </p>
          </div>
        </section>

        <section className={cn('rounded-card border border-ink/10 bg-ivory p-5 shadow-sm md:p-8', saving && 'opacity-90')} aria-labelledby="checkout-rules-heading">
          <h2 id="checkout-rules-heading" className="font-display text-lg! font-semibold">Checkout, Shipping & Return Rules</h2>
          <p className="mt-1 text-xs! text-ink-soft">Configure store taxation policies, free shipping thresholds, and return policy windows.</p>

          <div className="mt-4 rounded-xl border border-teal/20 bg-teal/5 p-4 text-xs! text-teal flex items-start gap-3">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold uppercase tracking-wider text-[11px]!">
                GST Compliance Notice (No GSTIN / Unregistered Business)
              </p>
              <p className="text-teal/90 leading-relaxed">
                Under <strong>Section 32 of the Indian CGST Act, 2017</strong>, businesses without a valid GSTIN registration are legally prohibited from collecting or displaying GST/tax from customers. To remain 100% compliant:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-teal/90">
                <li>Keep <strong>Tax rate (%)</strong> at <strong>0%</strong> (selling prices are treated as inclusive of all taxes).</li>
                <li><strong>Payment processing fee (%)</strong>: Can be configured (e.g. 2%) to recover digital payment gateway costs from customers legally as a commercial handling fee (not a tax).</li>
                <li>The store will automatically issue compliant <strong>Bills of Supply / Order Receipts</strong> instead of Tax Invoices.</li>
              </ul>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <FormField label="Tax rate (%)" htmlFor="tax-rate" hint="Locked at 0.00% (All-inclusive pricing legally enforced under CGST Act Section 32 for unregistered sellers)." required>
              <div className="relative"><input id="tax-rate" type="number" readOnly value={0} className={cn(inputCls(false), 'pr-10 bg-ink/5 text-ink-soft cursor-not-allowed')} /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm! text-ink-soft">%</span></div>
            </FormField>
            <FormField label="Payment processing fee (%)" htmlFor="payment-service-tax-rate" error={errors.paymentServiceTaxRatePercent?.message} hint="Nominal commercial fee charged to the customer to cover payment gateway expenses (e.g. 2% Razorpay fee). Charged as a service handling fee, not a tax." required>
              <div className="relative"><input id="payment-service-tax-rate" type="number" min={0} max={10} step="0.01" {...register('paymentServiceTaxRatePercent', { valueAsNumber: true })} className={cn(inputCls(!!errors.paymentServiceTaxRatePercent), 'pr-10')} /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm! text-ink-soft">%</span></div>
            </FormField>
            <FormField label="Free shipping minimum (₹)" htmlFor="free-shipping" error={errors.freeShippingMinimumAmount?.message} hint="Applied after coupon discounts. Enter 0 to disable automatic free shipping." required>
              <div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm! text-ink-soft">₹</span><input id="free-shipping" type="number" min={0} max={10000000} step="0.01" {...register('freeShippingMinimumAmount', { valueAsNumber: true })} className={cn(inputCls(!!errors.freeShippingMinimumAmount), 'pl-9')} /></div>
            </FormField>
            <FormField label="Return window (days)" htmlFor="return-window-days" error={errors.returnWindowDays?.message} hint="Number of days after delivery when returns are accepted. Set to 0 if returns are not accepted." required>
              <div className="relative">
                <input id="return-window-days" type="number" min={0} max={365} step={1} {...register('returnWindowDays', { valueAsNumber: true })} className={cn(inputCls(!!errors.returnWindowDays), 'pr-14')} />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm! text-ink-soft">days</span>
              </div>
              {Number(returnWindowDays) === 0 ? (
                <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-2.5 py-1.5 text-xs! font-medium text-ink-soft">
                  <RotateCcw size={14} className="shrink-0 text-ink-soft" aria-hidden />
                  <span><strong>0 days:</strong> Returns are not applicable (Orders cannot be returned).</span>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-teal/20 bg-teal/5 px-2.5 py-1.5 text-xs! font-medium text-teal">
                  <RotateCcw size={14} className="shrink-0 text-teal" aria-hidden />
                  <span>Returns accepted within <strong>{returnWindowDays} day{Number(returnWindowDays) === 1 ? '' : 's'}</strong> of delivery.</span>
                </div>
              )}
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
