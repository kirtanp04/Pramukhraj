import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, MapPin, Truck, CheckCircle2, PackageCheck } from 'lucide-react'
import { orders, products } from '@/mock'
import { formatINR, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

const statusVariant = { Delivered: 'teal', Shipped: 'turmeric', Processing: 'soft', Cancelled: 'outline' } as const
const timelineSteps = ['Ordered', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']

export function AccountOrders() {
  const [expanded, setExpanded] = useState<string | null>(orders[0]?.id ?? null)

  return (
    <div>
      <h2 className="mb-4 font-display text-xl">Order History</h2>
      <div className="space-y-4">
        {orders.map((o) => {
          const isOpen = expanded === o.id
          const stepIndex = o.status === 'Cancelled' ? -1 : timelineSteps.indexOf(o.status === 'Delivered' ? 'Delivered' : o.status)
          return (
            <div key={o.id} className="rounded-card border border-ink/10">
              <button
                onClick={() => setExpanded(isOpen ? null : o.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
              >
                <div>
                  <p className="font-mono text-sm">Order #{o.id}</p>
                  <p className="text-xs text-ink-soft">Placed on {new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <Badge variant={statusVariant[o.status]}>{o.status}</Badge>
                <span className="font-mono text-sm font-semibold">{formatINR(o.total)}</span>
                <ChevronDown size={16} className={cn('transition-transform', isOpen && 'rotate-180')} />
              </button>

              {isOpen && (
                <div className="border-t border-ink/10 p-4">
                  <div className="mb-5 space-y-3">
                    {o.items.map((it) => {
                      const p = products.find((pp) => pp.id === it.productId)
                      if (!p) return null
                      return (
                        <Link key={it.productId} to={`/product/${p.slug}`} className="flex items-center gap-3">
                          <img src={p.thumbnail} alt="" className="h-12 w-12 rounded-lg object-cover" />
                          <div className="flex-1">
                            <p className="line-clamp-1 text-sm">{p.name}</p>
                            <p className="text-xs text-ink-soft">Qty {it.quantity}</p>
                          </div>
                          <span className="font-mono text-sm">{formatINR(p.price * it.quantity)}</span>
                        </Link>
                      )
                    })}
                  </div>

                  {o.status !== 'Cancelled' && (
                    <div className="rounded-lg bg-ivory-dim p-4">
                      <div className="mb-3 flex items-center justify-between text-xs text-ink-soft">
                        <span className="flex items-center gap-1"><Truck size={13} /> {o.courier} · {o.trackingId}</span>
                        <span className="flex items-center gap-1"><MapPin size={13} /> Est. {o.expectedDelivery}</span>
                      </div>
                      <div className="flex items-center">
                        {timelineSteps.map((step, i) => (
                          <div key={step} className="flex flex-1 items-center last:flex-none">
                            <div className="flex flex-col items-center gap-1">
                              <div className={cn('flex h-6 w-6 items-center justify-center rounded-full', i <= stepIndex ? 'bg-oxblood text-ivory' : 'bg-ink/10 text-ink-soft')}>
                                {i <= stepIndex ? <CheckCircle2 size={13} /> : <PackageCheck size={13} />}
                              </div>
                              <span className="text-center text-[10px] text-ink-soft">{step}</span>
                            </div>
                            {i < timelineSteps.length - 1 && (
                              <div className={cn('mx-1 h-0.5 flex-1', i < stepIndex ? 'bg-oxblood' : 'bg-ink/10')} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
