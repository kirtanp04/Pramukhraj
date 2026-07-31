import * as Tabs from '@radix-ui/react-tabs'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

export function AdminSettings() {
  const canManage = useAuthStore((s) => s.hasPermission('settings.manage'))

  const Field = ({ label, defaultValue, type = 'text' }: { label: string; defaultValue?: string; type?: string }) => (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-soft">{label}</span>
      <input type={type} defaultValue={defaultValue} disabled={!canManage} className="admin-input disabled:opacity-60" />
    </label>
  )

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Settings</h1>
          <p className="text-sm text-ink-soft">Store configuration and system preferences.</p>
        </div>
        {canManage && <Button><Save size={15} /> Save Changes</Button>}
      </div>

      <Tabs.Root defaultValue="general">
        <Tabs.List className="flex flex-wrap gap-6 border-b border-ink/10">
          {['general', 'taxes', 'shipping', 'notifications'].map((t) => (
            <Tabs.Trigger key={t} value={t} className="border-b-2 border-transparent py-3 text-sm font-medium capitalize text-ink-soft data-[state=active]:border-oxblood data-[state=active]:text-oxblood">
              {t}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="general" className="grid gap-4 py-6 sm:grid-cols-2">
          <Field label="Store Name" defaultValue="PramukhRaj Foods" />
          <Field label="Support Email" defaultValue="support@pramukhraj.example" />
          <Field label="Support Phone" defaultValue="+91 79 4000 1234" />
          <Field label="Store Currency" defaultValue="INR (₹)" />
          <Field label="Business Address" defaultValue="Ahmedabad, Gujarat, India" />
          <Field label="GSTIN" defaultValue="24AAAAA0000A1Z5" />
        </Tabs.Content>

        <Tabs.Content value="taxes" className="grid gap-4 py-6 sm:grid-cols-2">
          <Field label="GST Rate (%)" defaultValue="5" type="number" />
          <Field label="Tax-Inclusive Pricing" defaultValue="Yes" />
        </Tabs.Content>

        <Tabs.Content value="shipping" className="grid gap-4 py-6 sm:grid-cols-2">
          <Field label="Free Shipping Threshold (₹)" defaultValue="499" type="number" />
          <Field label="Standard Shipping Fee (₹)" defaultValue="49" type="number" />
          <Field label="Express Shipping Fee (₹)" defaultValue="79" type="number" />
          <Field label="Default Delivery Estimate" defaultValue="3-5 business days" />
        </Tabs.Content>

        <Tabs.Content value="notifications" className="grid gap-4 py-6 sm:grid-cols-2">
          <Field label="Low Stock Alert Threshold" defaultValue="15" type="number" />
          <Field label="Order Notification Email" defaultValue="orders@pramukhraj.example" />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
