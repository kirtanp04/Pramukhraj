import { Link } from 'react-router-dom'
import { Package, MapPin, FileText, Star, ArrowRight } from 'lucide-react'
import { orders } from '@/mock'
import { formatINR } from '@/lib/utils'
import { useCustomerAuthStore } from '@/features/customer-auth/store/customerAuthStore'
import { Badge } from '@/components/ui/Badge'

const statusVariant = { Delivered: 'teal', Shipped: 'turmeric', Processing: 'soft', Cancelled: 'outline' } as const

export function AccountDashboard() {
  const customer = useCustomerAuthStore((s) => s.customer)

  return (
    <div className="space-y-8">
      <div className="rounded-card bg-gradient-to-br from-oxblood to-oxblood-deep p-6 text-ivory">
        <p className="text-sm! text-ivory/80">Welcome back,</p>
        <h2 className="font-display text-2xl!">{customer?.fullName || 'Valued Customer'}</h2>
        <p className="mt-1 text-sm! text-ivory/70">{customer?.email || customer?.mobileNumber || ''}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Orders', value: orders.length, icon: Package, to: '/account/orders' },
          { label: 'Addresses', value: 'Manage', icon: MapPin, to: '/account/addresses' },
          { label: 'Invoices', value: 'Receipts', icon: FileText, to: '/account/invoices' },
          { label: 'Reviews', value: 'Feedback', icon: Star, to: '/account/reviews' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="rounded-card border border-ink/10 p-4 hover:border-oxblood/40">
            <s.icon size={18} className="text-oxblood" />
            <p className="mt-2 font-display text-2xl!">{s.value}</p>
            <p className="text-xs! text-ink-soft">{s.label}</p>
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
