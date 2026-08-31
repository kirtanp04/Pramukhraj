import { useCallback, useMemo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/admin/DataTable'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { useAdminActions } from '@/hooks/useAdminActions'
import { useUrlPageParam } from '@/hooks/useUrlPageParam'
import { formatDateTime } from '@/lib/utils'
import type { AdminActionListItem } from '@/types/adminAction'

type AdminActionColumns = Parameters<
  typeof DataTable<AdminActionListItem>
>[0]['columns']

function actionBadgeVariant(action: string): 'success' | 'oxblood' | 'turmeric' | 'soft' {
  switch (action.trim().toLowerCase()) {
    case 'create':
    case 'add':
    case 'added':
      return 'success'
    case 'delete':
    case 'remove':
    case 'deleted':
      return 'oxblood'
    case 'update':
    case 'edit':
    case 'updated':
      return 'turmeric'
    default:
      return 'soft'
  }
}

export function AdminActions() {
  const { page, setPage } = useUrlPageParam()
  const {
    actions,
    pagination,
    isInitialLoading,
    isPageFetching,
    error,
    retry,
  } = useAdminActions(page)

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setPage])

  const columns = useMemo<AdminActionColumns>(() => [
    {
      header: 'Admin',
      accessorKey: 'adminName',
      cell: ({ row }) => (
        <div className="min-w-36">
          <p className="max-w-56 truncate font-medium">
            {row.original.adminName || 'Unknown admin'}
          </p>
          {row.original.adminId && (
            <p className="max-w-56 truncate font-mono text-[11px] text-ink-soft">
              {row.original.adminId}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Module',
      accessorKey: 'module',
      cell: ({ row }) => <Badge variant="soft">{row.original.module || 'General'}</Badge>,
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: ({ row }) => (
        <Badge variant={actionBadgeVariant(row.original.action)}>
          {row.original.action || 'Action'}
        </Badge>
      ),
    },
    {
      header: 'Entity',
      accessorKey: 'entityName',
      cell: ({ row }) => (
        <div className="min-w-36">
          <p className="max-w-64 truncate font-medium">
            {row.original.entityName || '—'}
          </p>
          {row.original.entityId && (
            <p className="max-w-64 truncate font-mono text-[11px] text-ink-soft">
              {row.original.entityId}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }) => (
        <span className="line-clamp-2 block min-w-52 max-w-md whitespace-normal text-ink-soft">
          {row.original.description || '—'}
        </span>
      ),
    },
    {
      header: 'Performed On',
      accessorKey: 'createdOn',
      cell: ({ row }) => (
        <time
          dateTime={row.original.createdOn}
          className="whitespace-nowrap text-xs text-ink-soft"
        >
          {formatDateTime(row.original.createdOn)}
        </time>
      ),
    },
  ], [])

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Admin Actions</h1>
        <p className="text-sm text-ink-soft">
          {isInitialLoading
            ? 'Loading admin actions...'
            : `${actions.length} actions on page ${page}`}
        </p>
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
          data={actions}
          searchPlaceholder="Search this page by admin, module, action, or entity..."
          pageSize={pagination.pageSize}
          isLoading={isInitialLoading}
          loadingRows={pagination.pageSize}
          emptyMessage={page > 1
            ? 'No admin actions found on this page.'
            : 'No admin actions have been recorded yet.'}
          hideFooter={!isInitialLoading && actions.length === 0 && page === 1}
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
