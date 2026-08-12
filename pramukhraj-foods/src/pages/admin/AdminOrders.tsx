import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Truck, PackageCheck, CheckCircle2 } from 'lucide-react'
import { orders as initialOrders, products, type Order } from '@/mock'
import { formatINR, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/admin/DataTable'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { useAuthStore } from '@/store/authStore'

const statusVariant = { Delivered: 'teal', Shipped: 'turmeric', Processing: 'soft', Cancelled: 'outline' } as const
const timelineSteps: Order['status'][] | string[] = ['Ordered', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']
const allStatuses: Order['status'][] = ['Processing', 'Shipped', 'Delivered', 'Cancelled']

export function AdminOrders() {
  const [items, setItems] = useState<Order[]>(initialOrders)
  const [selected, setSelected] = useState<Order | null>(null)
  const canManage = true
  const logAction = useAuthStore((s) => s.logAction)

  function updateStatus(orderId: string, status: Order['status']) {
    setItems((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o))
    setSelected((prev) => (prev && prev.id === orderId ? { ...prev, status } : prev))
    logAction('Updated order status', `#${orderId} → ${status}`)
  }

  const columns = useMemo<ColumnDef<Order, any>[]>(() => [
    { header: 'Order ID', accessorKey: 'id', cell: ({ row }) => <span className="font-mono">#{row.original.id}</span> },
    { header: 'Date', accessorKey: 'date', cell: ({ row }) => new Date(row.original.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { header: 'Items', accessorFn: (r) => r.items.reduce((s, i) => s + i.quantity, 0) },
    { header: 'Total', accessorKey: 'total', cell: ({ row }) => <span className="font-mono">{formatINR(row.original.total)}</span> },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> },
    {
      header: '', id: 'actions', enableSorting: false,
      cell: ({ row }) => (
        <button onClick={() => setSelected(row.original)} className="flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1 text-xs hover:bg-ink/5">
          <Eye size={13} /> View
        </button>
      ),
    },
  ], [])

  const stepIndex = selected ? (selected.status === 'Delivered' ? 4 : timelineSteps.indexOf(selected.status)) : -1

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Orders</h1>
        <p className="text-sm text-ink-soft">{items.length} orders total</p>
      </div>

      <DataTable columns={columns} data={items} searchPlaceholder="Search by order ID..." pageSize={8} />

      <AdminDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title={selected ? `Order #${selected.id}` : ''} description={selected ? new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}>
        {selected && (
          <div className="space-y-6">
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Items</p>
              <div className="space-y-3 rounded-lg bg-ivory-dim p-3">
                {selected.items.map((it) => {
                  const p = products.find((pp) => pp.id === it.productId)
                  if (!p) return null
                  return (
                    <div key={it.productId} className="flex items-center gap-3">
                      <img src={p.thumbnail} alt="" className="h-11 w-11 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="line-clamp-1 text-sm">{p.name}</p>
                        <p className="text-xs text-ink-soft">Qty {it.quantity}</p>
                      </div>
                      <span className="font-mono text-sm">{formatINR(p.price * it.quantity)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex justify-between text-sm font-semibold">
                <span>Total</span><span className="font-mono text-oxblood">{formatINR(selected.total)}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Shipment</p>
              <div className="rounded-lg bg-ivory-dim p-3 text-sm text-ink-soft">
                <p className="flex items-center gap-1.5"><Truck size={13} /> {selected.courier} · {selected.trackingId}</p>
                <p className="mt-1">Expected delivery: {selected.expectedDelivery}</p>
              </div>
              {selected.status !== 'Cancelled' && (
                <div className="mt-4 flex items-center">
                  {timelineSteps.map((step, i) => (
                    <div key={step} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={cn('flex h-7 w-7 items-center justify-center rounded-full', i <= stepIndex ? 'bg-oxblood text-ivory' : 'bg-ink/10 text-ink-soft')}>
                          {i <= stepIndex ? <CheckCircle2 size={13} /> : <PackageCheck size={13} />}
                        </div>
                        <span className="text-center text-[9px] text-ink-soft">{step}</span>
                      </div>
                      {i < timelineSteps.length - 1 && <div className={cn('mx-1 h-0.5 flex-1', i < stepIndex ? 'bg-oxblood' : 'bg-ink/10')} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {canManage && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {allStatuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs',
                        selected.status === s ? 'border-oxblood bg-oxblood text-ivory' : 'border-ink/15 hover:bg-ink/5',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminDrawer>
    </div>
  )
}
