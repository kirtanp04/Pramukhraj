import { useState } from 'react'
import { Mail, Eye } from 'lucide-react'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { Badge } from '@/components/ui/Badge'

const templates = [
  { key: 'welcome', name: 'Welcome Email', subject: 'Welcome to PramukhRaj Foods!', active: true },
  { key: 'order-confirmation', name: 'Order Confirmation', subject: 'Your order #{{order_id}} is confirmed', active: true },
  { key: 'invoice', name: 'Invoice', subject: 'Invoice for order #{{order_id}}', active: true },
  { key: 'shipment', name: 'Shipment Notification', subject: 'Your order is on its way!', active: true },
  { key: 'delivered', name: 'Delivered', subject: 'Your order has been delivered', active: true },
  { key: 'cancelled', name: 'Order Cancelled', subject: 'Your order #{{order_id}} was cancelled', active: true },
  { key: 'refund', name: 'Refund Processed', subject: 'Your refund has been processed', active: true },
  { key: 'password-reset', name: 'Password Reset', subject: 'Reset your PramukhRaj Foods password', active: true },
  { key: 'newsletter', name: 'Newsletter', subject: 'This week at PramukhRaj Foods', active: false },
  { key: 'coupon', name: 'Coupon Offer', subject: 'A little something for you 🎁', active: true },
]

export function AdminEmailTemplates() {
  const [preview, setPreview] = useState<typeof templates[number] | null>(null)
  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Email Templates</h1>
        <p className="text-sm text-ink-soft">Transactional and marketing email templates.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <div key={t.key} className="rounded-card border border-ink/10 bg-ivory p-4">
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-oxblood/10 text-oxblood"><Mail size={16} /></span>
              <Badge variant={t.active ? 'teal' : 'soft'}>{t.active ? 'Active' : 'Disabled'}</Badge>
            </div>
            <p className="mt-3 text-sm font-medium">{t.name}</p>
            <p className="line-clamp-1 text-xs text-ink-soft">{t.subject}</p>
            <button onClick={() => setPreview(t)} className="mt-3 flex items-center gap-1 text-xs text-oxblood hover:underline"><Eye size={12} /> Preview</button>
          </div>
        ))}
      </div>

      <AdminDrawer open={!!preview} onOpenChange={(o) => !o && setPreview(null)} title={preview?.name ?? ''} description={preview?.subject}>
        {preview && (
          <div className="rounded-lg border border-ink/10 bg-ivory-dim p-6 text-sm">
            <p className="mb-4 font-display text-lg">PramukhRaj Foods</p>
            <p className="text-ink-soft">Hi there,</p>
            <p className="mt-3 text-ink-soft">This is a preview of the <strong>{preview.name}</strong> email template. The live version merges in customer and order data at send time.</p>
            <div className="mt-5 inline-block rounded-full bg-oxblood px-4 py-2 text-xs text-ivory">View Details</div>
            <p className="mt-6 text-xs text-ink-soft">— The PramukhRaj Foods Team</p>
          </div>
        )}
      </AdminDrawer>
    </div>
  )
}
