import * as Switch from '@radix-ui/react-switch'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const integrations = [
  { key: 'razorpay', name: 'Razorpay', desc: 'Payment gateway for UPI, cards and net banking', connected: true },
  { key: 'shiprocket', name: 'Shiprocket', desc: 'Multi-courier shipping aggregator', connected: true },
  { key: 'msg91', name: 'MSG91', desc: 'SMS and OTP delivery', connected: true },
  { key: 'ga4', name: 'Google Analytics 4', desc: 'Web analytics and conversion tracking', connected: false },
  { key: 'mailchimp', name: 'Mailchimp', desc: 'Email marketing and newsletters', connected: false },
  { key: 'metapixel', name: 'Meta Pixel', desc: 'Ad conversion tracking for Facebook/Instagram', connected: false },
]

export function AdminIntegrations() {
  const [items, setItems] = useState(integrations)
  const canManage = useAuthStore((s) => s.hasPermission('settings.manage'))

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Integrations</h1>
        <p className="text-sm text-ink-soft">Connect third-party services to the store.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.key} className="rounded-card border border-ink/10 bg-ivory p-4">
            <div className="flex items-start justify-between">
              <p className="font-display text-lg">{it.name}</p>
              <Switch.Root
                checked={it.connected}
                disabled={!canManage}
                onCheckedChange={() => setItems((prev) => prev.map((p) => p.key === it.key ? { ...p, connected: !p.connected } : p))}
                className={cn('relative h-5 w-9 rounded-full transition-colors', it.connected ? 'bg-oxblood' : 'bg-ink/15')}
              >
                <Switch.Thumb className={cn('block h-4 w-4 translate-x-0.5 rounded-full bg-ivory transition-transform', it.connected && 'translate-x-[18px]')} />
              </Switch.Root>
            </div>
            <p className="mt-1 text-xs text-ink-soft">{it.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
