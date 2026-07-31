import { useState } from 'react'
import { Search, MapPin, PackageCheck, CheckCircle2 } from 'lucide-react'
import { orders, type Order } from '@/mock'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const timelineSteps = ['Ordered', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']

export function TrackOrder() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<Order | null>(orders[0] ?? null)

  function search() {
    const found = orders.find((o) => o.id.toLowerCase().includes(query.toLowerCase()) || o.trackingId.toLowerCase().includes(query.toLowerCase()))
    setResult(found ?? null)
  }

  const stepIndex = result ? (result.status === 'Delivered' ? 4 : timelineSteps.indexOf(result.status)) : -1

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="text-center font-display text-3xl">Track Your Order</h1>
      <p className="mt-2 text-center text-sm text-ink-soft">Enter your order ID or tracking number to see the latest status.</p>
      <div className="mx-auto mt-6 flex max-w-md gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. PRJ100234"
          className="w-full rounded-full border border-ink/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-oxblood/50"
        />
        <Button onClick={search}><Search size={15} /> Track</Button>
      </div>

      {result ? (
        <div className="mt-10 rounded-card border border-ink/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-mono">Order #{result.id}</span>
            <span className="flex items-center gap-1 text-ink-soft"><MapPin size={13} /> Expected {result.expectedDelivery}</span>
          </div>
          <div className="mt-6 flex items-center">
            {timelineSteps.map((step, i) => (
              <div key={step} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', i <= stepIndex ? 'bg-oxblood text-ivory' : 'bg-ink/10 text-ink-soft')}>
                    {i <= stepIndex ? <CheckCircle2 size={15} /> : <PackageCheck size={15} />}
                  </div>
                  <span className="text-center text-[11px] text-ink-soft">{step}</span>
                </div>
                {i < timelineSteps.length - 1 && <div className={cn('mx-1 h-0.5 flex-1', i < stepIndex ? 'bg-oxblood' : 'bg-ink/10')} />}
              </div>
            ))}
          </div>
          <div className="mt-8 aspect-[16/6] w-full rounded-lg bg-tan/60 bg-[radial-gradient(circle_at_30%_40%,rgba(122,37,49,0.15),transparent_60%)] flex items-center justify-center text-xs text-ink-soft">
            Live delivery map placeholder
          </div>
        </div>
      ) : query ? (
        <p className="mt-10 text-center text-sm text-ink-soft">No order found for "{query}". Try PRJ100234.</p>
      ) : null}
    </div>
  )
}
