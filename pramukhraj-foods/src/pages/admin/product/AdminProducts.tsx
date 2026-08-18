import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { products as initialProducts } from '@/mock'
import type { Product } from '@/types/catalog'
import { formatINR } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useMessageDialog } from '@/hooks/useMessageDialog'


export function AdminProducts() {
  const [items, setItems] = useState<Product[]>(initialProducts)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const navigate = useNavigate()
  const dialog = useMessageDialog()
  const canManage = true

  function confirmDelete() {
    if (!deleteTarget) return
    setItems((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    dialog.success(`"${deleteTarget.name}" has been removed from the catalog.`, {
      title: 'Product Deleted',
    })
    setDeleteTarget(null)
  }

  const columns = useMemo<ColumnDef<Product, any>[]>(
    () => [
      {
        header: 'Product',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <img
              src={row.original.thumbnail}
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
            <div>
              <p className="line-clamp-1 font-medium">{row.original.name}</p>
              <p className="font-mono text-xs text-ink-soft">{row.original.sku}</p>
            </div>
          </div>
        ),
      },
      {
        header: 'Category',
        accessorFn: (r) => r.category.name,
      },
      {
        header: 'Price',
        accessorKey: 'price',
        cell: ({ row }) => (
          <span className="font-mono">{formatINR(row.original.price)}</span>
        ),
      },
      {
        header: 'Stock',
        accessorKey: 'stock',
        cell: ({ row }) => {
          const s = row.original.stock
          return (
            <Badge variant={s === 0 ? 'oxblood' : s < 15 ? 'turmeric' : 'teal'}>
              {s === 0 ? 'Out of stock' : `${s} units`}
            </Badge>
          )
        },
      },
      {
        header: 'Rating',
        accessorKey: 'rating',
        cell: ({ row }) => `${row.original.rating.toFixed(1)} ★`,
      },
      {
        header: '',
        id: 'actions',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <a
              href={`/product/${row.original.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5"
              aria-label="View on storefront"
            >
              <Eye size={14} />
            </a>
            {canManage && (
              <>
                <button
                  onClick={() => navigate(`/admin/products/${row.original.id}/edit`)}
                  className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5"
                  aria-label="Edit product"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(row.original)}
                  className="rounded-full p-1.5 text-oxblood hover:bg-oxblood/5"
                  aria-label="Delete product"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [canManage, navigate],
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Products</h1>
          <p className="text-sm text-ink-soft">
            {items.length} products across the catalog
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-ivory hover:bg-oxblood-deep"
          >
            <Plus size={15} /> Add Product
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={items}
        searchPlaceholder="Search products by name or SKU…"
        pageSize={8}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this product?"
        description={`"${deleteTarget?.name}" will be permanently removed from the catalog. This cannot be undone.`}
        onConfirm={confirmDelete}
      />

      {/* Success / error feedback */}
      <MessageDialog {...dialog.props} />
    </div>
  )
}