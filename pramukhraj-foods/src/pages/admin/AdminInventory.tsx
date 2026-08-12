import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Minus, Plus } from 'lucide-react'
import { products as initialProducts } from '@/mock'
import type { Product } from '@/types/catalog'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/admin/DataTable'
import { useAuthStore } from '@/store/authStore'

export function AdminInventory() {
  const [items, setItems] = useState<Product[]>(initialProducts)
  const canManage = true
  const logAction = useAuthStore((s) => s.logAction)

  function adjustStock(id: string, delta: number) {
    const p = items.find((it) => it.id === id)
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, stock: Math.max(0, it.stock + delta) } : it))
    if (p) logAction(delta > 0 ? 'Restocked product' : 'Reduced stock', `${p.name} (${delta > 0 ? '+' : ''}${delta})`)
  }

  const lowStockCount = items.filter((p) => p.stock > 0 && p.stock < 15).length
  const outOfStockCount = items.filter((p) => p.stock === 0).length

  const columns = useMemo<ColumnDef<Product, any>[]>(() => [
    {
      header: 'Product', accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <div>
            <p className="line-clamp-1 font-medium">{row.original.name}</p>
            <p className="font-mono text-xs text-ink-soft">{row.original.sku}</p>
          </div>
        </div>
      ),
    },
    { header: 'Category', accessorFn: (r) => r.category.name },
    {
      header: 'Stock Level', accessorKey: 'stock',
      cell: ({ row }) => {
        const s = row.original.stock
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono">{s}</span>
            <Badge variant={s === 0 ? 'oxblood' : s < 15 ? 'turmeric' : 'teal'}>{s === 0 ? 'Out' : s < 15 ? 'Low' : 'In Stock'}</Badge>
          </div>
        )
      },
    },
    ...(canManage ? [{
      header: 'Adjust', id: 'adjust', enableSorting: false,
      cell: ({ row }: { row: { original: Product } }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => adjustStock(row.original.id, -5)} className="rounded-full border border-ink/15 p-1.5 hover:bg-ink/5" aria-label="Decrease stock"><Minus size={13} /></button>
          <button onClick={() => adjustStock(row.original.id, 5)} className="rounded-full border border-ink/15 p-1.5 hover:bg-ink/5" aria-label="Increase stock"><Plus size={13} /></button>
        </div>
      ),
    }] : []),
  ], [canManage])

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Inventory</h1>
        <p className="text-sm text-ink-soft">{items.length} SKUs · {lowStockCount} low stock · {outOfStockCount} out of stock</p>
      </div>
      <DataTable columns={columns} data={items} searchPlaceholder="Search SKU or product name..." pageSize={8} />
    </div>
  )
}
