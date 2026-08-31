import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import { AsyncEntityThumbnail } from '@/components/admin/AsyncEntityThumbnail'
import { DataTable } from '@/components/admin/DataTable'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { Badge } from '@/components/ui/Badge'
import { useAdminCategories } from '@/hooks/useAdminCategories'
import { useUrlPageParam } from '@/hooks/useUrlPageParam'
import { formatDateTime } from '@/lib/utils'
import type {
  AdminCategoryList,
  ProductCategoryListRouteState,
} from '@/types/productCategory'

type CategoryColumns = Parameters<typeof DataTable<AdminCategoryList>>[0]['columns']

export function AdminCategories() {
  const location = useLocation()
  const navigate = useNavigate()
  const { page, setPage } = useUrlPageParam()
  const routeState = location.state as ProductCategoryListRouteState | null
  const canManage = true

  const {
    categories,
    categoryImages,
    pagination,
    isInitialLoading,
    isPageFetching,
    categoriesError,
    imagesLoading,
    imagesError,
    retry,
  } = useAdminCategories(page)

  useEffect(() => {
    if (!routeState?.createdCategoryId) return
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location.pathname, location.search, navigate, routeState?.createdCategoryId])

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setPage])

  const columns = useMemo<CategoryColumns>(() => [
    {
      header: 'Category',
      accessorKey: 'name',
      cell: ({ row }) => {
        const category = row.original
        const imageUrl = categoryImages[category.id.toLowerCase()]?.imageurl

        return (
          <div className="flex items-center gap-3">
            <AsyncEntityThumbnail
              key={`${category.id}:${imageUrl ?? ''}`}
              imageUrl={imageUrl}
              alt={category.name}
              loading={imagesLoading}
            />
            <span className="max-w-64 truncate font-medium">{category.name}</span>
          </div>
        )
      },
    },
    {
      header: 'Slug',
      accessorKey: 'slug',
      cell: ({ row }) => (
        <span className="block max-w-64 truncate font-mono text-xs text-ink-soft">
          {row.original.slug}
        </span>
      ),
    },
    { header: 'Products', accessorKey: 'productCount' },
    {
      header: 'Featured',
      accessorKey: 'isFeatured',
      cell: ({ row }) => (
        <Badge variant={row.original.isFeatured ? 'turmeric' : 'soft'}>
          {row.original.isFeatured ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'oxblood'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Created On',
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
    {
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }) => (
        <span className="line-clamp-1 block max-w-sm text-ink-soft">
          {row.original.description || '—'}
        </span>
      ),
    },
    ...(canManage ? [{
      header: '',
      id: 'actions',
      enableSorting: false,
      cell: ({ row }: { row: { original: AdminCategoryList } }) => (
        <button
          type="button"
          onClick={() => navigate(`/admin/categories/${row.original.id}/edit`)}
          className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5"
          aria-label={`Edit ${row.original.name}`}
        >
          <Pencil size={14} aria-hidden />
        </button>
      ),
    }] : []),
  ], [canManage, categoryImages, imagesLoading, navigate])

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl">Categories</h1>
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              {isInitialLoading
                ? 'Loading categories...'
                : `${categories.length} categories on page ${page}`}
              {imagesError && (
                <span className="text-[11px] text-turmeric-deep" title={imagesError}>
                  Some images are unavailable.
                </span>
              )}
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => navigate('/admin/categories/new')}
              className="flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-ivory hover:bg-oxblood-deep"
            >
              <Plus size={15} aria-hidden /> Add Category
            </button>
          )}
        </div>

        {categoriesError ? (
          <ServerError
            className="h-auto min-h-96 py-16"
            message={categoriesError}
            action={{ label: 'Retry', onClick: () => void retry() }}
          />
        ) : (
          <DataTable
            columns={columns}
            data={categories}
            searchPlaceholder="Search this page..."
            pageSize={pagination.pageSize}
            isLoading={isInitialLoading}
            loadingRows={pagination.pageSize}
            emptyMessage={page > 1 ? 'No categories found on this page.' : 'No categories found.'}
            hideFooter={!isInitialLoading && categories.length === 0 && page === 1}
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

      {/* <div>
        <h2 className="mb-3 font-display text-xl">Brands</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {brands.map((brand) => (
            <div key={brand.id} className="rounded-card border border-ink/10 p-4 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-oxblood/10 font-display text-lg text-oxblood">
                {brand.name[0]}
              </div>
              <p className="mt-2 text-sm font-medium">{brand.name}</p>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  )
}
