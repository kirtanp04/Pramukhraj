import { Link } from 'react-router-dom'
import { Package, Heart, Wallet, Star, ArrowRight } from 'lucide-react'
import { orders } from '@/mock'
import { formatINR } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { Badge } from '@/components/ui/Badge'

const statusVariant = { Delivered: 'teal', Shipped: 'turmeric', Processing: 'soft', Cancelled: 'outline' } as const

export function AccountDashboard() {
  const wishlist = useCartStore((s) => s.wishlist)

  return (
    <div className="space-y-8">
      <div className="rounded-card bg-gradient-to-br from-oxblood to-oxblood-deep p-6 text-ivory">
        <p className="text-sm text-ivory/80">Welcome back,</p>
        <h2 className="font-display text-2xl">Aarav Sharma</h2>
        <p className="mt-1 text-sm text-ivory/70">aarav.sharma@example.com</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Orders', value: orders.length, icon: Package, to: '/account/orders' },
          { label: 'Wishlist', value: wishlist.length, icon: Heart, to: '/account/wishlist' },
          { label: 'Wallet Balance', value: '₹250', icon: Wallet, to: '/account/wallet' },
          { label: 'Reward Points', value: '1,240', icon: Star, to: '/account/wallet' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="rounded-card border border-ink/10 p-4 hover:border-oxblood/40">
            <s.icon size={18} className="text-oxblood" />
            <p className="mt-2 font-display text-2xl">{s.value}</p>
            <p className="text-xs text-ink-soft">{s.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg">Recent Orders</h3>
          <Link to="/account/orders" className="flex items-center gap-1 text-sm text-oxblood hover:underline">View all <ArrowRight size={13} /></Link>
        </div>
        <div className="divide-y divide-ink/10 rounded-card border border-ink/10">
          {orders.slice(0, 3).map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-mono text-sm">#{o.id}</p>
                <p className="text-xs text-ink-soft">{new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <Badge variant={statusVariant[o.status]}>{o.status}</Badge>
              <span className="font-mono text-sm font-semibold">{formatINR(o.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
