import { useCallback, useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { useFaqList } from '@/hooks/faq/useFaqList'
import { useUrlPageParam } from '@/hooks/useUrlPageParam'
import { formatDateTime } from '@/lib/utils'
import { FAQ_CATEGORY_LABELS, type FaqListItem } from '@/types/faq'

export function FaqList() {
  const navigate = useNavigate()
  const { page, setPage } = useUrlPageParam()
  const { data, isLoading, error, retry } = useFaqList(page)

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setPage])

  const columns = useMemo<ColumnDef<FaqListItem, unknown>[]>(() => [
    {
      header: 'FAQ',
      accessorKey: 'question',
      cell: ({ row }) => (
        <div className="max-w-md whitespace-normal">
          <p className="line-clamp-2 font-medium">{row.original.question}</p>
          <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{row.original.answerPreview}</p>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: ({ row }) => (
        <Badge variant="soft">{FAQ_CATEGORY_LABELS[row.original.category] ?? 'Unknown'}</Badge>
      ),
    },
    { header: 'Order', accessorKey: 'displayOrder' },
    {
      header: 'Visibility',
      id: 'visibility',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={row.original.isActive ? 'success' : 'oxblood'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {row.original.isFeatured && <Badge variant="turmeric">Featured</Badge>}
        </div>
      ),
    },
    {
      header: 'Updated On',
      accessorKey: 'updatedOn',
      cell: ({ row }) => (
        <time dateTime={row.original.updatedOn} className="whitespace-nowrap text-xs text-ink-soft">
          {formatDateTime(row.original.updatedOn)}
        </time>
      ),
    },
    {
      header: '',
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/faqs/${row.original.id}/edit`)}
          className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5"
          aria-label={`Edit ${row.original.question}`}
        >
          <Pencil size={14} aria-hidden />
        </button>
      ),
    },
  ], [navigate])

  const items = data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">FAQs</h1>
          <p className="text-sm text-ink-soft">
            {isLoading && !data ? 'Loading FAQs...' : `${data?.totalCount ?? 0} FAQs in total`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/faqs/new')}
          className="flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-ivory hover:bg-oxblood-deep"
        >
          <Plus size={15} aria-hidden /> Add FAQ
        </button>
      </div>

      {error ? (
        <ServerError
          className="h-auto min-h-96 py-16"
          message={error}
          action={{ label: 'Retry', onClick: () => void retry() }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          searchPlaceholder="Search this page by question, answer or category..."
          pageSize={data?.pageSize ?? 10}
          isLoading={isLoading && !data}
          loadingRows={10}
          emptyMessage={page > 1 ? 'No FAQs found on this page.' : 'No FAQs found.'}
          hideFooter={!isLoading && items.length === 0 && page === 1}
          serverPagination={{
            page,
            hasPreviousPage: page > 1,
            hasNextPage: Boolean(data && page < data.totalPages),
            isFetching: isLoading,
            onPageChange: handlePageChange,
          }}
        />
      )}
    </div>
  )
}
