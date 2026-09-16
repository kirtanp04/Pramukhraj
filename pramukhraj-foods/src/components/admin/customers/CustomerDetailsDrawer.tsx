import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { CheckCircle2, LoaderCircle, MapPin, ShieldCheck, ShoppingCart, Star, UserRound } from 'lucide-react'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { FieldError, FieldLabel } from '@/components/ui/Typography'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { getApiErrorMessage, getApiValidationErrors } from '@/lib/apiClient'
import { formatDateTime } from '@/lib/utils'
import { adminCustomerApi } from '@/services/adminCustomerApi'
import { adminCustomerPatchSchema, type AdminCustomerPatchValues } from '@/types/adminCustomerSchema'
import type { AdminCustomerDetails, AdminCustomerStatus } from '@/types/adminCustomer'

interface CustomerDetailsDrawerProps {
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (customer: AdminCustomerDetails) => void
}

const EMPTY_FORM: AdminCustomerPatchValues = {
  fullName: '', email: '', city: '', state: '', postalCode: '', marketingConsent: false,
  status: 'ACTIVE', blockReason: '', concurrencyStamp: '',
}

function statusBadge(status: AdminCustomerStatus) {
  if (status === 'ACTIVE') return <Badge variant="success">Active</Badge>
  if (status === 'BLOCKED') return <Badge variant="oxblood">Blocked</Badge>
  if (status === 'INACTIVE') return <Badge variant="outline">Inactive</Badge>
  return <Badge variant="soft">Deleted</Badge>
}

export function CustomerDetailsDrawer({ customerId, open, onOpenChange, onUpdated }: CustomerDetailsDrawerProps) {
  const [details, setDetails] = useState<AdminCustomerDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const messageDialog = useMessageDialog()
  const form = useForm<AdminCustomerPatchValues>({ resolver: zodResolver(adminCustomerPatchSchema), defaultValues: EMPTY_FORM })
  const selectedStatus = form.watch('status')

  useEffect(() => {
    if (!open || !customerId) return
    const controller = new AbortController()
    setIsLoading(true)
    setLoadError(null)
    setDetails(null)
    adminCustomerApi.getById(customerId, controller.signal)
      .then(customer => {
        if (!customer || controller.signal.aborted) return
        setDetails(customer)
        form.reset({
          fullName: customer.fullName,
          email: customer.email ?? '',
          city: customer.city ?? '',
          state: customer.state ?? '',
          postalCode: customer.postalCode ?? '',
          marketingConsent: customer.marketingConsent,
          status: customer.status === 'DELETED' ? 'INACTIVE' : customer.status,
          blockReason: customer.blockReason ?? '',
          concurrencyStamp: customer.concurrencyStamp,
        })
      })
      .catch(error => { if (!controller.signal.aborted) setLoadError(getApiErrorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => controller.abort()
  }, [customerId, form, open])

  async function submit(values: AdminCustomerPatchValues) {
    if (!customerId) return
    try {
      const response = await adminCustomerApi.patch(customerId, values)
      if (!response.data) throw new Error('The server did not return the updated customer.')
      setDetails(response.data)
      form.reset({
        ...values,
        status: response.data.status === 'DELETED' ? 'INACTIVE' : response.data.status,
        concurrencyStamp: response.data.concurrencyStamp,
      })
      onUpdated(response.data)
      messageDialog.success(response.message, { title: 'Customer Updated' })
    } catch (error) {
      const validationErrors = getApiValidationErrors(error)
      for (const [field, messages] of Object.entries(validationErrors)) {
        const formField = `${field.charAt(0).toLowerCase()}${field.slice(1)}` as keyof AdminCustomerPatchValues
        form.setError(formField, { message: messages[0] })
      }
      if (Object.keys(validationErrors).length === 0) {
        messageDialog.error(getApiErrorMessage(error), { title: 'Could Not Update Customer' })
      }
    }
  }

  return (
    <AdminDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={details?.fullName || 'Customer details'}
      description="Profile, account access, verification and saved addresses"
    >
      {isLoading ? <DrawerSkeleton /> : loadError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm! text-red-800">
          <p>{loadError}</p>
          <Button className="mt-4" size="sm" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      ) : details ? (
        <div className="space-y-6">
          <section className="rounded-card bg-teal p-5 text-ivory">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ivory/15 font-display text-xl!">
                {(details.fullName || details.mobileNumber).slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-display text-xl!">{details.fullName || 'Profile incomplete'}</h2>
                  {statusBadge(details.status)}
                </div>
                <p className="mt-1 text-sm! text-ivory/75">{details.mobileNumber} · {details.email || 'No email'}</p>
                <p className="mt-2 text-xs! text-ivory/60">Customer since {formatDateTime(details.createdOn)}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric icon={MapPin} label="Addresses" value={details.addresses.length} />
            <Metric icon={Star} label="Reviews" value={details.reviewCount} />
            <Metric icon={ShoppingCart} label="Active carts" value={details.activeCartCount} />
            <Metric icon={ShieldCheck} label="Sessions" value={details.activeSessionCount} />
          </section>

          <section>
            <h3 className="mb-3 font-display text-lg!">Account information</h3>
            <div className="grid grid-cols-1 gap-3 rounded-card border border-ink/10 p-4 sm:grid-cols-2">
              <Info label="Mobile verification" value={details.isMobileVerified ? 'Verified' : 'Not verified'} positive={details.isMobileVerified} />
              <Info label="Email verification" value={details.isEmailVerified ? 'Verified' : 'Not verified'} positive={details.isEmailVerified} />
              <Info label="Profile" value={details.isProfileCompleted ? 'Complete' : 'Incomplete'} positive={details.isProfileCompleted} />
              <Info label="Last login" value={details.lastLoginOn ? formatDateTime(details.lastLoginOn) : 'Never'} />
              <Info label="Updated" value={formatDateTime(details.updatedOn)} />
              <Info label="Converted carts" value={String(details.convertedCartCount)} />
            </div>
          </section>

          <form onSubmit={form.handleSubmit(submit)} className="space-y-4 rounded-card border border-ink/10 p-4">
            <div>
              <h3 className="font-display text-lg!">Manage customer</h3>
              <p className="text-xs! text-ink-soft">Changing account access immediately revokes active customer sessions.</p>
            </div>
            <div>
              <FieldLabel htmlFor="customer-name">Full name</FieldLabel>
              <Input id="customer-name" {...form.register('fullName')} error={Boolean(form.formState.errors.fullName)} disabled={details.status === 'DELETED'} />
              {form.formState.errors.fullName && <FieldError>{form.formState.errors.fullName.message}</FieldError>}
            </div>
            <div>
              <FieldLabel htmlFor="customer-email">Email</FieldLabel>
              <Input id="customer-email" type="email" {...form.register('email')} error={Boolean(form.formState.errors.email)} disabled={details.status === 'DELETED'} />
              {form.formState.errors.email && <FieldError>{form.formState.errors.email.message}</FieldError>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div><FieldLabel htmlFor="customer-city">City</FieldLabel><Input id="customer-city" {...form.register('city')} disabled={details.status === 'DELETED'} /></div>
              <div><FieldLabel htmlFor="customer-state">State</FieldLabel><Input id="customer-state" {...form.register('state')} disabled={details.status === 'DELETED'} /></div>
              <div><FieldLabel htmlFor="customer-postal">Postal code</FieldLabel><Input id="customer-postal" {...form.register('postalCode')} error={Boolean(form.formState.errors.postalCode)} disabled={details.status === 'DELETED'} /></div>
            </div>
            {form.formState.errors.postalCode && <FieldError>{form.formState.errors.postalCode.message}</FieldError>}
            <div>
              <FieldLabel htmlFor="customer-status">Account status</FieldLabel>
              <select id="customer-status" {...form.register('status')} disabled={details.status === 'DELETED'} className="h-12 w-full rounded-xl border border-ink/15 bg-ivory px-4 text-sm! outline-none focus:border-turmeric-deep focus:ring-2 focus:ring-turmeric/20">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
            {selectedStatus === 'BLOCKED' && (
              <div>
                <FieldLabel htmlFor="customer-block-reason">Block reason</FieldLabel>
                <textarea id="customer-block-reason" rows={3} {...form.register('blockReason')} className="w-full resize-none rounded-xl border border-ink/15 bg-ivory px-4 py-3 text-sm! outline-none focus:border-turmeric-deep focus:ring-2 focus:ring-turmeric/20" />
                {form.formState.errors.blockReason && <FieldError>{form.formState.errors.blockReason.message}</FieldError>}
              </div>
            )}
            <label className="flex items-start gap-3 rounded-xl bg-ink/3 p-3 text-sm!">
              <input type="checkbox" {...form.register('marketingConsent')} disabled={details.status === 'DELETED'} className="mt-0.5 h-4 w-4 accent-teal" />
              <span><span className="font-medium">Marketing consent</span><span className="mt-0.5 block text-xs! text-ink-soft">Allow promotional communication for this customer.</span></span>
            </label>
            {form.formState.errors.root && <FieldError>{form.formState.errors.root.message}</FieldError>}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || details.status === 'DELETED'}>
              {form.formState.isSubmitting && <LoaderCircle size={16} className="animate-spin" />} Save customer
            </Button>
          </form>

          <section>
            <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-lg!">Saved addresses</h3><span className="text-xs! text-ink-soft">{details.addresses.length} total</span></div>
            {details.addresses.length === 0 ? (
              <div className="rounded-card border border-dashed border-ink/15 px-4 py-8 text-center text-sm! text-ink-soft">No saved addresses.</div>
            ) : <div className="space-y-3">{details.addresses.map(address => (
              <article key={address.id} className="rounded-card border border-ink/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-medium">{address.recipientName}</p><p className="text-xs! text-ink-soft">{address.addressType} · {address.mobileNumber}</p></div>
                  <div className="flex flex-wrap justify-end gap-1">{address.isDefaultShipping && <Badge variant="teal">Shipping</Badge>}{address.isDefaultBilling && <Badge variant="turmeric">Billing</Badge>}</div>
                </div>
                <p className="mt-3 text-sm! leading-6 text-ink-soft">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />{address.city}, {address.state} {address.postalCode}{address.landmark ? ` · ${address.landmark}` : ''}</p>
              </article>
            ))}</div>}
          </section>
        </div>
      ) : null}
      <MessageDialog {...messageDialog.props} />
    </AdminDrawer>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: number }) {
  return <div className="rounded-card border border-ink/10 p-3"><Icon size={16} className="text-teal" /><p className="mt-2 font-display text-xl!">{value}</p><p className="text-[10px]! uppercase tracking-wide text-ink-soft">{label}</p></div>
}

function Info({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return <div><p className="text-[10px]! uppercase tracking-wide text-ink-soft">{label}</p><p className="mt-1 flex items-center gap-1 text-sm! font-medium">{positive && <CheckCircle2 size={13} className="text-emerald-600" />}{value}</p></div>
}

function DrawerSkeleton() {
  return <div className="space-y-4"><Skeleton className="h-32 rounded-card" /><div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-card" />)}</div><Skeleton className="h-64 rounded-card" /></div>
}
