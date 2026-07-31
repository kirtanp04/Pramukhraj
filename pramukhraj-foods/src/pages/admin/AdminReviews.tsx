import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Check, Flag } from 'lucide-react'
import { products } from '@/mock'
import { Rating } from '@/components/ui/Rating'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/admin/DataTable'
import { useAuthStore } from '@/store/authStore'

interface FlatReview {
  id: string
  productName: string
  productSlug: string
  author: string
  rating: number
  title: string
  comment: string
  date: string
  status: 'Published' | 'Flagged'
}

const seedReviews: FlatReview[] = products.slice(0, 40).flatMap((p) =>
  p.reviews.map((r) => ({
    id: r.id, productName: p.name, productSlug: p.slug, author: r.author, rating: r.rating,
    title: r.title, comment: r.comment, date: r.date, status: r.rating <= 2 ? 'Flagged' : 'Published',
  })),
)

export function AdminReviews() {
  const [items, setItems] = useState<FlatReview[]>(seedReviews)
  const canManage = useAuthStore((s) => s.hasPermission('reviews.manage'))
  const logAction = useAuthStore((s) => s.logAction)

  function setStatus(id: string, status: FlatReview['status']) {
    const r = items.find((it) => it.id === id)
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, status } : it))
    if (r) logAction(status === 'Published' ? 'Approved review' : 'Flagged review', `${r.author} on ${r.productName}`)
  }

  const columns = useMemo<ColumnDef<FlatReview, any>[]>(() => [
    {
      header: 'Review', accessorKey: 'title',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="font-medium">{row.original.title}</p>
          <p className="line-clamp-1 text-xs text-ink-soft">{row.original.comment}</p>
        </div>
      ),
    },
    { header: 'Product', accessorKey: 'productName', cell: ({ row }) => <span className="line-clamp-1 max-w-40 block">{row.original.productName}</span> },
    { header: 'Author', accessorKey: 'author' },
    { header: 'Rating', accessorKey: 'rating', cell: ({ row }) => <Rating value={row.original.rating} size={12} /> },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={row.original.status === 'Published' ? 'teal' : 'oxblood'}>{row.original.status}</Badge> },
    ...(canManage ? [{
      header: '', id: 'actions', enableSorting: false,
      cell: ({ row }: { row: { original: FlatReview } }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setStatus(row.original.id, 'Published')} className="rounded-full p-1.5 text-green-700 hover:bg-green-50" aria-label="Approve"><Check size={14} /></button>
          <button onClick={() => setStatus(row.original.id, 'Flagged')} className="rounded-full p-1.5 text-oxblood hover:bg-oxblood/5" aria-label="Flag"><Flag size={14} /></button>
        </div>
      ),
    }] : []),
  ], [canManage])

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Reviews</h1>
        <p className="text-sm text-ink-soft">{items.length} reviews · {items.filter((i) => i.status === 'Flagged').length} flagged for attention</p>
      </div>
      <DataTable columns={columns} data={items} searchPlaceholder="Search reviews..." pageSize={8} />
    </div>
  )
}
