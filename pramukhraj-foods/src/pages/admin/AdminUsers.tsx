import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { AdminUser } from '@/types/admin'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/admin/DataTable'
import { useAuthStore } from '@/store/authStore'

export function AdminUsers() {
  const currentUser = useAuthStore((state) => state.user)
  const items = useMemo(() => (currentUser ? [currentUser] : []), [currentUser])

  const columns = useMemo<ColumnDef<AdminUser>[]>(() => [
    {
      header: 'Admin',
      accessorKey: 'username',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.username} <span className="text-[10px] text-ink-soft">(you)</span></p>
          <p className="text-xs text-ink-soft">{row.original.email}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      id: 'status',
      cell: ({ row }) => <Badge variant={row.original.isDeleted ? 'oxblood' : 'teal'}>{row.original.isDeleted ? 'Disabled' : 'Active'}</Badge>,
    },
  ], [])

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Admin Users</h1>
        <p className="text-sm text-ink-soft">Your authenticated admin account</p>
      </div>
      <DataTable columns={columns} data={items} searchPlaceholder="Search your account..." pageSize={8} />
    </div>
  )
}
