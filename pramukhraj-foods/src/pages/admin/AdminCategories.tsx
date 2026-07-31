import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil } from 'lucide-react'
import { categories as initialCategories, brands, type Category } from '@/mock'
import { DataTable } from '@/components/admin/DataTable'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

export function AdminCategories() {
  const [items, setItems] = useState<Category[]>(initialCategories)
  const [editing, setEditing] = useState<Category | null>(null)
  const canManage = useAuthStore((s) => s.hasPermission('categories.manage'))
  const logAction = useAuthStore((s) => s.logAction)
  const { register, handleSubmit, reset } = useForm<{ description: string }>()

  function openEdit(c: Category) {
    setEditing(c)
    reset({ description: c.description })
  }
  function onSubmit(values: { description: string }) {
    if (!editing) return
    setItems((prev) => prev.map((c) => c.id === editing.id ? { ...c, description: values.description } : c))
    logAction('Updated category description', editing.name)
    setEditing(null)
  }

  const columns = useMemo<ColumnDef<Category, any>[]>(() => [
    {
      header: 'Category', accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.image} alt="" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    { header: 'Slug', accessorKey: 'slug', cell: ({ row }) => <span className="font-mono text-xs">{row.original.slug}</span> },
    { header: 'Products', accessorKey: 'productCount' },
    { header: 'Description', accessorKey: 'description', cell: ({ row }) => <span className="line-clamp-1 block max-w-sm text-ink-soft">{row.original.description}</span> },
    ...(canManage ? [{
      header: '', id: 'actions', enableSorting: false,
      cell: ({ row }: { row: { original: Category } }) => (
        <button onClick={() => openEdit(row.original)} className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5" aria-label="Edit"><Pencil size={14} /></button>
      ),
    }] : []),
  ], [canManage])

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-5">
          <h1 className="font-display text-2xl">Categories</h1>
          <p className="text-sm text-ink-soft">{items.length} categories</p>
        </div>
        <DataTable columns={columns} data={items} searchPlaceholder="Search categories..." pageSize={8} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl">Brands</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {brands.map((b) => (
            <div key={b.id} className="rounded-card border border-ink/10 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-oxblood/10 font-display text-lg text-oxblood">
                {b.name[0]}
              </div>
              <p className="mt-2 text-sm font-medium">{b.name}</p>
            </div>
          ))}
        </div>
      </div>

      <AdminDrawer open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={`Edit ${editing?.name ?? ''}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Description</span>
            <textarea {...register('description')} rows={4} className="admin-input resize-none" />
          </label>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </AdminDrawer>
    </div>
  )
}
