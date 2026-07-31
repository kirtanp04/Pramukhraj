import * as Switch from '@radix-ui/react-switch'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const initialFlags = [
  { key: 'wishlist-sharing', name: 'Wishlist Sharing', desc: 'Allow customers to share wishlists via link', enabled: true },
  { key: 'guest-checkout', name: 'Guest Checkout', desc: 'Allow checkout without creating an account', enabled: true },
  { key: 'ai-search', name: 'AI-Powered Search Suggestions', desc: 'Smarter instant search ranking', enabled: false },
  { key: 'subscribe-save', name: 'Subscribe & Save', desc: 'Recurring delivery subscriptions', enabled: false },
  { key: 'loyalty-v2', name: 'Loyalty Program v2', desc: 'New tiered rewards structure', enabled: false },
]

export function AdminFeatureFlags() {
  const [flags, setFlags] = useState(initialFlags)
  const canManage = useAuthStore((s) => s.hasPermission('settings.manage'))
  const logAction = useAuthStore((s) => s.logAction)

  function toggle(key: string) {
    const f = flags.find((fl) => fl.key === key)
    setFlags((prev) => prev.map((fl) => fl.key === key ? { ...fl, enabled: !fl.enabled } : fl))
    if (f) logAction(f.enabled ? 'Disabled feature flag' : 'Enabled feature flag', f.name)
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Feature Flags</h1>
        <p className="text-sm text-ink-soft">Roll out experimental storefront features safely.</p>
      </div>
      <div className="divide-y divide-ink/10 rounded-card border border-ink/10 bg-ivory">
        {flags.map((f) => (
          <div key={f.key} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{f.name}</p>
              <p className="text-xs text-ink-soft">{f.desc}</p>
            </div>
            <Switch.Root
              checked={f.enabled}
              disabled={!canManage}
              onCheckedChange={() => toggle(f.key)}
              className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', f.enabled ? 'bg-oxblood' : 'bg-ink/15')}
            >
              <Switch.Thumb className={cn('block h-4 w-4 translate-x-0.5 rounded-full bg-ivory transition-transform', f.enabled && 'translate-x-[18px]')} />
            </Switch.Root>
          </div>
        ))}
      </div>
    </div>
  )
}
