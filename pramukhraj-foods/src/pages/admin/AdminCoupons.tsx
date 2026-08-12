import { useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { coupons as initialCoupons, type Coupon } from '@/mock'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/admin/DataTable'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAuthStore } from '@/store/authStore'

const statusVariant = { Active: 'teal', Expired: 'outline', Scheduled: 'turmeric' } as const

const schema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').transform((s) => s.toUpperCase()),
  type: z.enum(['Percentage', 'Flat']),
  value: z.coerce.number().positive('Value must be greater than 0'),
  minOrder: z.coerce.number().min(0),
  expiresOn: z.string().min(1, 'Pick an expiry date'),
})
type FormValues = z.infer<typeof schema>

export function AdminCoupons() {
  const [items, setItems] = useState<Coupon[]>(initialCoupons)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const canManage = true
  const logAction = useAuthStore((s) => s.logAction)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) as Resolver<FormValues> })

  function openCreate() {
    setEditing(null)
    reset({ code: '', type: 'Percentage', value: 10, minOrder: 0, expiresOn: '' })
    setDrawerOpen(true)
  }
  function openEdit(c: Coupon) {
    setEditing(c)
    reset({ code: c.code, type: c.type, value: c.value, minOrder: c.minOrder, expiresOn: c.expiresOn })
    setDrawerOpen(true)
  }
  function onSubmit(values: FormValues) {
    if (editing) {
      setItems((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...values } : c))
      logAction('Updated coupon', values.code)
    } else {
      setItems((prev) => [{ id: `cp-${Date.now()}`, ...values, status: 'Active', usageCount: 0, usageLimit: 1000 }, ...prev])
      logAction('Created coupon', values.code)
    }
    setDrawerOpen(false)
  }
  function confirmDelete() {
    if (!deleteTarget) return
    setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    logAction('Deleted coupon', deleteTarget.code)
    setDeleteTarget(null)
  }

  const columns = useMemo<ColumnDef<Coupon, any>[]>(() => [
    { header: 'Code', accessorKey: 'code', cell: ({ row }) => <span className="font-mono font-semibold">{row.original.code}</span> },
    { header: 'Discount', accessorKey: 'value', cell: ({ row }) => row.original.type === 'Percentage' ? `${row.original.value}%` : `₹${row.original.value}` },
    { header: 'Min Order', accessorKey: 'minOrder', cell: ({ row }) => `₹${row.original.minOrder}` },
    { header: 'Usage', accessorKey: 'usageCount', cell: ({ row }) => `${row.original.usageCount} / ${row.original.usageLimit}` },
    { header: 'Expires', accessorKey: 'expiresOn' },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> },
    ...(canManage ? [{
      header: '', id: 'actions', enableSorting: false,
      cell: ({ row }: { row: { original: Coupon } }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row.original)} className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5" aria-label="Edit"><Pencil size={14} /></button>
          <button onClick={() => setDeleteTarget(row.original)} className="rounded-full p-1.5 text-oxblood hover:bg-oxblood/5" aria-label="Delete"><Trash2 size={14} /></button>
        </div>
      ),
    }] : []),
  ], [canManage])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Coupons</h1>
          <p className="text-sm text-ink-soft">{items.length} coupons configured</p>
        </div>
        {canManage && <Button onClick={openCreate}><Plus size={15} /> New Coupon</Button>}
      </div>
      <DataTable columns={columns} data={items} searchPlaceholder="Search coupon codes..." pageSize={8} />

      <AdminDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={editing ? 'Edit Coupon' : 'New Coupon'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Coupon Code</span>
            <input {...register('code')} className="admin-input uppercase" />
            {errors.code && <span className="mt-1 block text-xs text-oxblood">{errors.code.message}</span>}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Discount Type</span>
              <select {...register('type')} className="admin-input">
                <option value="Percentage">Percentage</option>
                <option value="Flat">Flat Amount</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Value</span>
              <input type="number" {...register('value')} className="admin-input" />
              {errors.value && <span className="mt-1 block text-xs text-oxblood">{errors.value.message}</span>}
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Minimum Order (₹)</span>
              <input type="number" {...register('minOrder')} className="admin-input" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Expires On</span>
              <input type="date" {...register('expiresOn')} className="admin-input" />
              {errors.expiresOn && <span className="mt-1 block text-xs text-oxblood">{errors.expiresOn.message}</span>}
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Create Coupon'}</Button>
          </div>
        </form>
      </AdminDrawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this coupon?"
        description={`"${deleteTarget?.code}" will no longer be redeemable.`}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
