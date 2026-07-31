import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Ban, CheckCircle } from 'lucide-react'
import { adminUsers as initialUsers, DEMO_PASSWORD } from '@/mock/adminUsers'
import { roles, getRole } from '@/mock/roles'
import type { AdminUser } from '@/types/admin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/admin/DataTable'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  roleId: z.string().min(1, 'Select a role'),
})
type FormValues = z.infer<typeof schema>

export function AdminUsers() {
  const [items, setItems] = useState<AdminUser[]>(initialUsers)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const currentUser = useAuthStore((s) => s.user)
  const canManage = useAuthStore((s) => s.hasPermission('users.manage'))
  const logAction = useAuthStore((s) => s.logAction)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function openCreate() {
    setEditing(null)
    reset({ name: '', email: '', roleId: roles[roles.length - 1].id })
    setDrawerOpen(true)
  }
  function openEdit(u: AdminUser) {
    setEditing(u)
    reset({ name: u.name, email: u.email, roleId: u.roleId })
    setDrawerOpen(true)
  }
  function onSubmit(values: FormValues) {
    if (editing) {
      setItems((prev) => prev.map((u) => u.id === editing.id ? { ...u, ...values } : u))
      logAction('Updated admin user', values.email)
    } else {
      setItems((prev) => [{
        id: `au-${Date.now()}`, ...values, password: DEMO_PASSWORD,
        avatar: `https://i.pravatar.cc/100?u=${values.email}`, status: 'Active', lastLogin: null,
      }, ...prev])
      logAction('Invited admin user', values.email)
    }
    setDrawerOpen(false)
  }
  function toggleStatus(u: AdminUser) {
    const next = u.status === 'Active' ? 'Suspended' : 'Active'
    setItems((prev) => prev.map((it) => it.id === u.id ? { ...it, status: next } : it))
    logAction(next === 'Suspended' ? 'Suspended admin user' : 'Reactivated admin user', u.name)
  }

  const columns = useMemo<ColumnDef<AdminUser, any>[]>(() => [
    {
      header: 'Admin', accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          <div>
            <p className="flex items-center gap-1.5 font-medium">
              {row.original.name}
              {row.original.id === currentUser?.id && <span className="text-[10px] text-ink-soft">(you)</span>}
            </p>
            <p className="text-xs text-ink-soft">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role', accessorKey: 'roleId',
      cell: ({ row }) => {
        const r = getRole(row.original.roleId)
        return r ? <Badge variant={r.color}>{r.name}</Badge> : '—'
      },
    },
    { header: 'Last Login', accessorKey: 'lastLogin', cell: ({ row }) => row.original.lastLogin ? new Date(row.original.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never' },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={row.original.status === 'Active' ? 'teal' : 'oxblood'}>{row.original.status}</Badge> },
    ...(canManage ? [{
      header: '', id: 'actions', enableSorting: false,
      cell: ({ row }: { row: { original: AdminUser } }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row.original)} className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5" aria-label="Edit"><Pencil size={14} /></button>
          {row.original.id !== currentUser?.id && (
            <button
              onClick={() => toggleStatus(row.original)}
              className={cn('rounded-full p-1.5', row.original.status === 'Active' ? 'text-oxblood hover:bg-oxblood/5' : 'text-green-700 hover:bg-green-50')}
              aria-label={row.original.status === 'Active' ? 'Suspend' : 'Reactivate'}
            >
              {row.original.status === 'Active' ? <Ban size={14} /> : <CheckCircle size={14} />}
            </button>
          )}
        </div>
      ),
    }] : []),
  ], [canManage, currentUser])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Admin Users</h1>
          <p className="text-sm text-ink-soft">{items.length} console accounts</p>
        </div>
        {canManage && <Button onClick={openCreate}><Plus size={15} /> Invite Admin</Button>}
      </div>

      <DataTable columns={columns} data={items} searchPlaceholder="Search admin users..." pageSize={8} />

      <AdminDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Admin User' : 'Invite Admin User'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Full Name</span>
            <input {...register('name')} className="admin-input" />
            {errors.name && <span className="mt-1 block text-xs text-oxblood">{errors.name.message}</span>}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Email</span>
            <input {...register('email')} className="admin-input" />
            {errors.email && <span className="mt-1 block text-xs text-oxblood">{errors.email.message}</span>}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Role</span>
            <select {...register('roleId')} className="admin-input">
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Send Invite'}</Button>
          </div>
        </form>
      </AdminDrawer>
    </div>
  )
}
