import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAuthStore } from '@/store/authStore'

interface BlogPostRow {
  id: string
  title: string
  slug: string
  author: string
  date: string
  status: 'Published' | 'Draft'
}

const initialPosts: BlogPostRow[] = [
  { id: 'bp-1', title: '5 Ways to Serve Papad Beyond the Plate', slug: 'papad-serving-ideas', author: 'Aditi Rao', date: '2026-07-12', status: 'Published' },
  { id: 'bp-2', title: 'A Guide to Gujarati Pickle Making', slug: 'gujarati-pickle-guide', author: 'Aditi Rao', date: '2026-06-28', status: 'Published' },
  { id: 'bp-3', title: 'Building the Perfect Festival Gift Box', slug: 'festival-gift-box-guide', author: 'Aditi Rao', date: '2026-06-10', status: 'Published' },
  { id: 'bp-4', title: 'Why Small-Batch Namkeen Tastes Better', slug: 'small-batch-namkeen', author: 'Aditi Rao', date: '2026-05-22', status: 'Published' },
  { id: 'bp-5', title: 'Behind the Scenes: Our Ahmedabad Kitchen', slug: 'behind-the-scenes-kitchen', author: 'Aditi Rao', date: '2026-08-05', status: 'Draft' },
]

export function AdminBlog() {
  const [items, setItems] = useState(initialPosts)
  const [deleteTarget, setDeleteTarget] = useState<BlogPostRow | null>(null)
  const canManage = true
  const logAction = useAuthStore((s) => s.logAction)

  function toggleStatus(p: BlogPostRow) {
    const next = p.status === 'Published' ? 'Draft' : 'Published'
    setItems((prev) => prev.map((it) => it.id === p.id ? { ...it, status: next } : it))
    logAction(next === 'Published' ? 'Published blog post' : 'Unpublished blog post', p.title)
  }
  function confirmDelete() {
    if (!deleteTarget) return
    setItems((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    logAction('Deleted blog post', deleteTarget.title)
    setDeleteTarget(null)
  }

  const columns = useMemo<ColumnDef<BlogPostRow, any>[]>(() => [
    { header: 'Title', accessorKey: 'title', cell: ({ row }) => <span className="line-clamp-1 block max-w-sm font-medium">{row.original.title}</span> },
    { header: 'Author', accessorKey: 'author' },
    { header: 'Date', accessorKey: 'date' },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => <Badge variant={row.original.status === 'Published' ? 'teal' : 'soft'}>{row.original.status}</Badge> },
    ...(canManage ? [{
      header: '', id: 'actions', enableSorting: false,
      cell: ({ row }: { row: { original: BlogPostRow } }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => toggleStatus(row.original)} className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5" aria-label="Toggle publish"><Pencil size={14} /></button>
          <button onClick={() => setDeleteTarget(row.original)} className="rounded-full p-1.5 text-oxblood hover:bg-oxblood/5" aria-label="Delete"><Trash2 size={14} /></button>
        </div>
      ),
    }] : []),
  ], [canManage])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Blog</h1>
          <p className="text-sm text-ink-soft">{items.length} posts · {items.filter((p) => p.status === 'Published').length} published</p>
        </div>
        {canManage && <Button><Plus size={15} /> New Post</Button>}
      </div>
      <DataTable columns={columns} data={items} searchPlaceholder="Search posts..." pageSize={8} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this post?"
        description={`"${deleteTarget?.title}" will be permanently removed.`}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
