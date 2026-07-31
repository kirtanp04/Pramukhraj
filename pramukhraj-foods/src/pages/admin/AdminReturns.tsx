import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { orders, products } from '@/mock'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/admin/DataTable'
import { formatINR } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

interface ReturnRequest { id: string; orderId: string; product: string; reason: string; amount: number; status: 'Requested' | 'Approved' | 'Rejected' | 'Refunded' }

const seedReturns: ReturnRequest[] = orders.slice(0, 4).map((o, i) => {
  const p = products.find((pp) => pp.id === o.items[0]?.productId)
  return {
    id: `ret-${i + 1}`, orderId: o.id, product: p?.name ?? 'Unknown item',
    reason: ['Damaged in transit', 'Wrong item received', 'Quality not as expected', 'Changed my mind'][i % 4],
    amount: p?.price ?? 199, status: (['Requested', 'Approved', 'Refunded', 'Rejected'] as const)[i % 4],
  }
})

const statusVariant = { Requested: 'turmeric', Approved: 'teal', Refunded: 'soft', Rejected: 'oxblood' } as const

export function AdminReturns() {
  const [items, setItems] = useState(seedReturns)
  const canManage = useAuthStore((s) => s.hasPermission('returns.manage'))
  const logAction = useAuthStore((s) => s.logAction)

  function setStatus(id: string, status: ReturnRequest['status']) {
    const r = items.find((it) => it.id === id)
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, status } : it))
    if (r) logAction('Updated return status', `${r.orderId} → ${status}`)
  }

  const columns = useMemo<ColumnDef<ReturnRequest, any>[]>(() => [
    { header: 'Order', accessorKey: 'orderId', cell: ({ row }) => <span className="font-mono">#{row.original.orderId}</span> },
    { header: 'Product', accessorKey: 'product', cell: ({ row }) => <span className="line-clamp-1 block max-w-48">{row.original.product}</span> },
    { header: 'Reason', accessorKey: 'reason' },
    { header: 'Amount', accessorKey: 'amount', cell: ({ row }) => <span className="font-mono">{formatINR(row.original.amount)}</span> },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> },
    ...(canManage ? [{
      header: '', id: 'actions', enableSorting: false,
      cell: ({ row }: { row: { original: ReturnRequest } }) => (
        <select
          value={row.original.status}
          onChange={(e) => setStatus(row.original.id, e.target.value as ReturnRequest['status'])}
          className="rounded-full border border-ink/15 bg-ivory px-2 py-1 text-xs outline-none"
        >
          {(['Requested', 'Approved', 'Refunded', 'Rejected'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    }] : []),
  ], [canManage])

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Returns &amp; Refunds</h1>
        <p className="text-sm text-ink-soft">{items.length} return requests</p>
      </div>
      <DataTable columns={columns} data={items} searchPlaceholder="Search returns..." pageSize={8} />
    </div>
  )
}
