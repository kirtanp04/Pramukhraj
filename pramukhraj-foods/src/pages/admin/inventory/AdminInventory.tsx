import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle, Boxes, PackageX, Pencil } from 'lucide-react'
import { AsyncEntityThumbnail } from '@/components/admin/AsyncEntityThumbnail'
import { DataTable } from '@/components/admin/DataTable'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { Badge } from '@/components/ui/Badge'
import { MessageDialog } from '@/components/ui/MessageDialog'
import { useAdminInventory } from '@/hooks/useAdminInventory'
import { useMessageDialog } from '@/hooks/useMessageDialog'
import { useUrlPageParam } from '@/hooks/useUrlPageParam'
import { getApiErrorMessage } from '@/lib/apiClient'
import type { AdminInventoryItem } from '@/types/inventory'
import type { InventoryUpdateFormValues } from '@/types/inventorySchema'
import { InventoryEditDialog } from '@/pages/admin/inventory/InventoryEditDialog'

type InventoryColumns = Parameters<typeof DataTable<AdminInventoryItem>>[0]['columns']

function formatWeight(weight: number, unit: string): string {
  const displayWeight = Number.isInteger(weight) ? weight.toString() : weight.toLocaleString('en-IN')
  return `${displayWeight} ${unit.trim()}`.trim()
}

function getStockState(stock: number) {
  if (stock <= 0) return { label: 'Out of stock', variant: 'oxblood' as const }
  if (stock < 15) return { label: 'Low stock', variant: 'turmeric' as const }
  return { label: 'In stock', variant: 'teal' as const }
}

export function AdminInventory() {
  const messageDialog = useMessageDialog()
  const { page, setPage } = useUrlPageParam()
  const [editTarget, setEditTarget] = useState<AdminInventoryItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const {
    inventory,
    productImages,
    pagination,
    isInitialLoading,
    isPageFetching,
    inventoryError,
    imagesLoading,
    imagesError,
    retry,
    updateVariantInventory,
  } = useAdminInventory(page)

  const lowStockCount = inventory.filter(item => item.stock > 0 && item.stock < 15).length
  const outOfStockCount = inventory.filter(item => item.stock <= 0).length

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setPage])

  const openEditor = useCallback((item: AdminInventoryItem) => {
    setUpdateError(null)
    setEditTarget(item)
  }, [])

  const handleEditorOpenChange = useCallback((open: boolean) => {
    if (open || isSaving) return
    setEditTarget(null)
    setUpdateError(null)
  }, [isSaving])

  async function handleInventoryUpdate(values: InventoryUpdateFormValues) {
    if (!editTarget || isSaving) return

    setIsSaving(true)
    setUpdateError(null)

    try {
      const response = await updateVariantInventory({
        productId: editTarget.productId,
        variantId: editTarget.id,
        stock: values.stock,
        isActive: values.isActive,
      })

      setEditTarget(null)
      messageDialog.success(response.message, { title: 'Inventory Updated' })
    } catch (error: unknown) {
      setUpdateError(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const columns = useMemo<InventoryColumns>(() => [
    {
      header: 'Product',
      accessorKey: 'name',
      cell: ({ row }) => {
        const item = row.original
        const imageUrl = productImages[item.productId.toLowerCase()]?.imageurl

        return (
          <div className="flex items-center gap-3">
            <AsyncEntityThumbnail
              key={`${item.productId}:${imageUrl ?? ''}`}
              imageUrl={imageUrl}
              alt={item.name}
              loading={imagesLoading}
            />
            <div className="min-w-0">
              <p className="max-w-64 truncate font-medium">{item.name}</p>
              <p className="max-w-64 truncate font-mono text-xs text-ink-soft">{item.slug}</p>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Variant',
      id: 'variant',
      accessorFn: item => formatWeight(item.weight, item.weightUnit),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium">
          {formatWeight(row.original.weight, row.original.weightUnit) || '—'}
        </span>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'categoryName',
      cell: ({ row }) => (
        <span className="block max-w-48 truncate">{row.original.categoryName || '—'}</span>
      ),
    },
    {
      header: 'Stock Level',
      accessorKey: 'stock',
      cell: ({ row }) => {
        const stockState = getStockState(row.original.stock)
        return (
          <div className="flex items-center gap-2">
            <span className="min-w-8 font-mono font-semibold">{row.original.stock}</span>
            <Badge variant={stockState.variant}>{stockState.label}</Badge>
          </div>
        )
      },
    },
    {
      header: 'Product Status',
      accessorKey: 'isProductActive',
      cell: ({ row }) => (
        <Badge variant={row.original.isProductActive ? 'success' : 'oxblood'}>
          {row.original.isProductActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Variant Status',
      accessorKey: 'isVariantActive',
      cell: ({ row }) => (
        <Badge variant={row.original.isVariantActive ? 'success' : 'oxblood'}>
          {row.original.isVariantActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: '',
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => openEditor(row.original)}
          className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5"
          aria-label={`Edit ${row.original.name}`}
          title="Edit product inventory"
        >
          <Pencil size={14} aria-hidden />
        </button>
      ),
    },
  ], [imagesLoading, openEditor, productImages])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl">Inventory</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
          <span>
            {isInitialLoading
              ? 'Loading inventory...'
              : `${inventory.length} variants on page ${page}`}
          </span>
          {imagesError && (
            <span className="text-[11px] text-turmeric-deep" title={imagesError}>
              Some product images are unavailable.
            </span>
          )}
        </p>
      </div>

      {!inventoryError && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Variants on this page', value: inventory.length, icon: Boxes, tone: 'text-teal bg-teal/10' },
            { label: 'Low stock', value: lowStockCount, icon: AlertTriangle, tone: 'text-turmeric-deep bg-turmeric/15' },
            { label: 'Out of stock', value: outOfStockCount, icon: PackageX, tone: 'text-oxblood bg-oxblood/10' },
          ].map(summary => (
            <div key={summary.label} className="flex items-center gap-3 rounded-card border border-ink/10 bg-ivory p-4">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${summary.tone}`}>
                <summary.icon size={19} aria-hidden />
              </span>
              <div>
                <p className="font-display text-2xl leading-none">{isInitialLoading ? '—' : summary.value}</p>
                <p className="mt-1 text-xs text-ink-soft">{summary.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {inventoryError ? (
        <ServerError
          className="h-auto min-h-96 py-16"
          message={inventoryError}
          action={{ label: 'Retry', onClick: () => void retry() }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={inventory}
          searchPlaceholder="Search this page by product, category, or variant..."
          pageSize={pagination.pageSize}
          isLoading={isInitialLoading}
          loadingRows={pagination.pageSize}
          emptyMessage={page > 1 ? 'No inventory found on this page.' : 'No inventory records found.'}
          hideFooter={!isInitialLoading && inventory.length === 0 && page === 1}
          serverPagination={{
            page: pagination.page,
            hasPreviousPage: pagination.hasPreviousPage,
            hasNextPage: pagination.hasNextPage,
            isFetching: isPageFetching,
            onPageChange: handlePageChange,
          }}
        />
      )}

      <InventoryEditDialog
        item={editTarget}
        open={!!editTarget}
        isSaving={isSaving}
        serverError={updateError}
        onOpenChange={handleEditorOpenChange}
        onSubmit={handleInventoryUpdate}
      />

      <MessageDialog {...messageDialog.props} />
    </div>
  )
}
