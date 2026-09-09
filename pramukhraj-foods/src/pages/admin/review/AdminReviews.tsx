import { useCallback, useMemo } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Rating } from '@/components/ui/Rating'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { useAdminReviews } from '@/hooks/useAdminReviews'
import { useUrlPageParam } from '@/hooks/useUrlPageParam'
import { formatDateTime } from '@/lib/utils'
import {
  REVIEW_SOURCE_LABELS,
  REVIEW_STATUS,
  REVIEW_STATUS_LABELS,
  REVIEW_TYPE,
  REVIEW_TYPE_LABELS,
  type AdminReviewListItem,
} from '@/types/review'

function statusVariant(status: AdminReviewListItem['status']) {
  if (status === REVIEW_STATUS.Approved) return 'success' as const
  if (status === REVIEW_STATUS.Rejected) return 'oxblood' as const
  return 'turmeric' as const
}

export function AdminReviews() {
  const navigate = useNavigate()
  const { page, setPage } = useUrlPageParam()
  const { items, pagination, isInitialLoading, isPageFetching, error, retry } = useAdminReviews(page)

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setPage])

  const columns = useMemo<ColumnDef<AdminReviewListItem, any>[]>(() => [
    {
      header: 'Review',
      accessorKey: 'title',
      cell: ({ row }) => (
        <div className="max-w-80 whitespace-normal">
          <p className="truncate font-medium">{row.original.title || 'Untitled review'}</p>
          <p className="line-clamp-2 text-xs text-ink-soft">{row.original.commentPreview}</p>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customerName}</p>
          {row.original.customerCity && <p className="text-xs text-ink-soft">{row.original.customerCity}</p>}
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'reviewType',
      cell: ({ row }) => (
        <div className="space-y-1">
          <Badge variant={row.original.reviewType === REVIEW_TYPE.BrandTestimonial ? 'soft' : 'teal'}>
            {REVIEW_TYPE_LABELS[row.original.reviewType] ?? 'Unknown'}
          </Badge>
          {row.original.productName && <p className="max-w-40 truncate text-xs text-ink-soft">{row.original.productName}</p>}
        </div>
      ),
    },
    {
      header: 'Source',
      accessorKey: 'source',
      cell: ({ row }) => REVIEW_SOURCE_LABELS[row.original.source] ?? 'Unknown',
    },
    {
      header: 'Rating',
      accessorKey: 'rating',
      cell: ({ row }) => <Rating value={row.original.rating} size={12} />,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={statusVariant(row.original.status)}>{REVIEW_STATUS_LABELS[row.original.status] ?? 'Unknown'}</Badge>
          {row.original.isFeatured && <Badge variant="soft">Featured</Badge>}
          {!row.original.isActive && <Badge variant="oxblood">Inactive</Badge>}
          {row.original.isVerifiedPurchase && <Badge variant="teal">Verified</Badge>}
        </div>
      ),
    },
    {
      header: 'Created On',
      accessorKey: 'createdOn',
      cell: ({ row }) => (
        <time dateTime={row.original.createdOn} className="whitespace-nowrap text-xs text-ink-soft">
          {formatDateTime(row.original.createdOn)}
        </time>
      ),
    },
    {
      header: '',
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => row.original.reviewType === REVIEW_TYPE.BrandTestimonial ? (
        <button
          type="button"
          onClick={() => navigate(`/admin/reviews/${row.original.id}/edit`)}
          className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5"
          aria-label={`Edit review by ${row.original.customerName}`}
        >
          <Pencil size={14} aria-hidden />
        </button>
      ) : (
        <span className="text-xs text-ink-soft" title="The server does not allow editing customer-authored product reviews.">Read only</span>
      ),
    },
  ], [navigate])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">Reviews</h1>
          <p className="text-sm text-ink-soft">
            {isInitialLoading ? 'Loading reviews...' : `${items.length} reviews on page ${page}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/reviews/new')}
          className="flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-ivory hover:bg-oxblood-deep"
        >
          <Plus size={15} aria-hidden /> Add Testimonial
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
          searchPlaceholder="Search this page by customer, product or review..."
          pageSize={pagination.pageSize}
          isLoading={isInitialLoading}
          loadingRows={pagination.pageSize}
          emptyMessage={page > 1 ? 'No reviews found on this page.' : 'No reviews found.'}
          hideFooter={!isInitialLoading && items.length === 0 && page === 1}
          serverPagination={{
            page: pagination.page,
            hasPreviousPage: pagination.hasPreviousPage,
            hasNextPage: pagination.hasNextPage,
            isFetching: isPageFetching,
            onPageChange: handlePageChange,
          }}
        />
      )}
    </div>
  )
}
