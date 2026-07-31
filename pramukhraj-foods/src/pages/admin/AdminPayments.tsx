import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { orders } from '@/mock'
import { formatINR } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/admin/DataTable'

interface Payment { id: string; orderId: string; method: string; amount: number; status: 'Success' | 'Pending' | 'Failed' }

const methods = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash on Delivery']
const payments: Payment[] = orders.map((o, i) => ({
  id: `pay-${i + 1}`, orderId: o.id, method: methods[i % methods.length], amount: o.total,
  status: o.status === 'Cancelled' ? 'Failed' : (['Success', 'Success', 'Pending'] as const)[i % 3],
}))
const statusVariant = { Success: 'teal', Pending: 'turmeric', Failed: 'oxblood' } as const

export function AdminPayments() {
  const columns = useMemo<ColumnDef<Payment, any>[]>(() => [
    { header: 'Payment ID', accessorKey: 'id', cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span> },
    { header: 'Order', accessorKey: 'orderId', cell: ({ row }) => <span className="font-mono">#{row.original.orderId}</span> },
    { header: 'Method', accessorKey: 'method' },
    { header: 'Amount', accessorKey: 'amount', cell: ({ row }) => <span className="font-mono">{formatINR(row.original.amount)}</span> },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> },
  ], [])

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Payments</h1>
        <p className="text-sm text-ink-soft">Transaction records across all orders.</p>
      </div>
      <DataTable columns={columns} data={payments} searchPlaceholder="Search payments..." pageSize={8} />
    </div>
  )
}
