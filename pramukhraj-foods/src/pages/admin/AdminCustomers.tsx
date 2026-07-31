import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Ban, CheckCircle } from 'lucide-react'
import { customers as initialCustomers, type Customer } from '@/mock'
import { formatINR, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/admin/DataTable'
import { useAuthStore } from '@/store/authStore'

export function AdminCustomers() {
  const [items, setItems] = useState<Customer[]>(initialCustomers)
  const canManage = useAuthStore((s) => s.hasPermission('customers.manage'))
  const logAction = useAuthStore((s) => s.logAction)

  function toggleStatus(c: Customer) {
    const next = c.status === 'Active' ? 'Blocked' : 'Active'
    setItems((prev) => prev.map((it) => it.id === c.id ? { ...it, status: next } : it))
    logAction(next === 'Blocked' ? 'Blocked customer' : 'Unblocked customer', c.name)
  }

  const columns = useMemo<ColumnDef<Customer, any>[]>(() => [
    {
      header: 'Customer', accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-ink-soft">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'City', accessorKey: 'city' },
    { header: 'Orders', accessorKey: 'ordersCount' },
    { header: 'Total Spent', accessorKey: 'totalSpent', cell: ({ row }) => <span className="font-mono">{formatINR(row.original.totalSpent)}</span> },
    { header: 'Joined', accessorKey: 'joined', cell: ({ row }) => new Date(row.original.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={row.original.status === 'Active' ? 'teal' : 'oxblood'}>{row.original.status}</Badge> },
    ...(canManage ? [{
      header: '', id: 'actions', enableSorting: false,
      cell: ({ row }: { row: { original: Customer } }) => (
        <button
          onClick={() => toggleStatus(row.original)}
          className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs',
            row.original.status === 'Active' ? 'border-oxblood/30 text-oxblood hover:bg-oxblood/5' : 'border-green-600/30 text-green-700 hover:bg-green-50')}
        >
          {row.original.status === 'Active' ? <><Ban size={12} /> Block</> : <><CheckCircle size={12} /> Unblock</>}
        </button>
      ),
    }] : []),
  ], [canManage])

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Customers</h1>
        <p className="text-sm text-ink-soft">{items.length} registered customers</p>
      </div>
      <DataTable columns={columns} data={items} searchPlaceholder="Search by name or email..." pageSize={8} />
    </div>
  )
}
