import { Package, Star, Ticket, AlertTriangle } from 'lucide-react'

const notifications = [
  { icon: Package, title: 'Low stock alert', desc: '12 products are below the reorder threshold.', time: '10 min ago' },
  { icon: Star, title: 'New review flagged', desc: 'A 1-star review on Ratlami Sev needs moderation.', time: '1 hr ago' },
  { icon: Ticket, title: 'Coupon expiring soon', desc: 'FLAT100 expires in 3 days.', time: '3 hrs ago' },
  { icon: AlertTriangle, title: 'Failed payment', desc: 'Order #PRJ100236 payment failed via UPI.', time: '5 hrs ago' },
  { icon: Package, title: 'Out of stock', desc: '3 products are now out of stock.', time: '1 day ago' },
]

export function AdminNotifications() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Notifications</h1>
        <p className="text-sm text-ink-soft">System alerts across orders, inventory and content.</p>
      </div>
      <div className="divide-y divide-ink/10 rounded-card border border-ink/10 bg-ivory">
        {notifications.map((n, i) => (
          <div key={i} className="flex items-start gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-oxblood/10 text-oxblood"><n.icon size={16} /></span>
            <div className="flex-1">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-ink-soft">{n.desc}</p>
            </div>
            <span className="shrink-0 text-xs text-ink-soft">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
