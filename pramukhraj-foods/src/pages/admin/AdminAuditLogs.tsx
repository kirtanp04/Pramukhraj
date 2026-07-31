import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'
import { useAuthStore } from '@/store/authStore'
import type { AuditLogEntry } from '@/types/admin'

export function AdminAuditLogs() {
  const auditLog = useAuthStore((s) => s.auditLog)

  const columns = useMemo<ColumnDef<AuditLogEntry, any>[]>(() => [
    { header: 'Actor', accessorKey: 'actor', cell: ({ row }) => <span className="font-medium">{row.original.actor}</span> },
    { header: 'Action', accessorKey: 'action' },
    { header: 'Target', accessorKey: 'target', cell: ({ row }) => <span className="line-clamp-1 block max-w-sm text-ink-soft">{row.original.target}</span> },
    { header: 'Timestamp', accessorKey: 'timestamp', cell: ({ row }) => new Date(row.original.timestamp).toLocaleString('en-IN') },
    { header: 'IP Address', accessorKey: 'ip', cell: ({ row }) => <span className="font-mono text-xs">{row.original.ip}</span> },
  ], [])

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Audit Logs</h1>
        <p className="text-sm text-ink-soft">A record of every action taken across the admin console this session.</p>
      </div>
      <DataTable columns={columns} data={auditLog} searchPlaceholder="Search audit log..." pageSize={10} />
    </div>
  )
}
