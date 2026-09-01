import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Archive, Pencil, Plus } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { DataTable } from '@/components/admin/DataTable'
import { ServerError } from '@/components/ui/ApiErrorPage'
import { useCouponList } from '@/hooks/coupon/useCouponList'
import { getApiErrorMessage } from '@/lib/apiClient'
import { couponApi } from '@/services/couponApi'
import { CouponStatusBadge } from '@/pages/admin/coupon/components/CouponStatusBadge'
import type {
  CouponApplicationScope, CouponDiscountType, CouponListItemResponse, CouponSearchParams, CouponStatus,
} from '@/types/coupon'

const statuses: CouponStatus[] = ['Active', 'Scheduled', 'Expired', 'Inactive', 'UsageLimitReached', 'Archived']
const discountTypes: CouponDiscountType[] = ['Percentage', 'FlatAmount', 'FreeShipping']
const scopes: CouponApplicationScope[] = ['AllProducts', 'SpecificProducts', 'SpecificCategories']

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}
function fromAllowed<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && allowed.includes(value as T) ? value as T : undefined
}

export function CouponList() {
  const navigate = useNavigate()
  const [urlParams, setUrlParams] = useSearchParams()
  const pageNumber = parsePage(urlParams.get('page'))
  const urlSearch = urlParams.get('search')?.trim() ?? ''
  const [searchInput, setSearchInput] = useState(urlSearch)
  const filters: CouponSearchParams = useMemo(() => ({
    pageNumber,
    search: urlSearch || undefined,
    isActive: urlParams.get('active') === 'true' ? true : urlParams.get('active') === 'false' ? false : undefined,
    status: fromAllowed(urlParams.get('status'), statuses),
    discountType: fromAllowed(urlParams.get('discountType'), discountTypes),
    applicationScope: fromAllowed(urlParams.get('scope'), scopes),
  }), [pageNumber, urlParams, urlSearch])
  const { data, error, isLoading, refresh } = useCouponList(filters)
  const [archiveTarget, setArchiveTarget] = useState<CouponListItemResponse | null>(null)
  const [archiving, setArchiving] = useState(false)

  useEffect(() => setSearchInput(urlSearch), [urlSearch])
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const normalized = searchInput.trim()
      if (normalized === urlSearch) return
      setUrlParams(previous => {
        const next = new URLSearchParams(previous)
        if (normalized) next.set('search', normalized)
        else next.delete('search')
        next.set('page', '1')
        return next
      }, { replace: true })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput, setUrlParams, urlSearch])

  function setFilter(name: string, value: string) {
    setUrlParams(previous => {
      const next = new URLSearchParams(previous)
      if (value) next.set(name, value)
      else next.delete(name)
      if (name !== 'page') next.set('page', '1')
      return next
    })
  }

  async function archiveCoupon() {
    if (!archiveTarget || archiving) return
    setArchiving(true)
    try {
      await couponApi.archive(archiveTarget.id)
      toast.success(`${archiveTarget.code} was archived.`)
      refresh()
    } catch (caught: unknown) {
      toast.error(getApiErrorMessage(caught))
    } finally {
      setArchiving(false)
      setArchiveTarget(null)
    }
  }

  const columns = useMemo<ColumnDef<CouponListItemResponse, unknown>[]>(() => [
    { header: 'Coupon', accessorKey: 'code', enableSorting: false, cell: ({ row }) => <div><p className="font-mono font-semibold text-ink">{row.original.code}</p><p className="max-w-48 truncate text-xs text-ink-soft">{row.original.name}</p></div> },
    { header: 'Discount', accessorKey: 'displayFriendlyDiscount', enableSorting: false, cell: ({ row }) => <div><p className="font-medium">{row.original.displayFriendlyDiscount}</p><p className="text-xs text-ink-soft">Min. ₹{row.original.minimumOrderAmount.toLocaleString('en-IN')}{row.original.maximumDiscountAmount ? ` · Max. ₹${row.original.maximumDiscountAmount.toLocaleString('en-IN')}` : ''}</p></div> },
    { header: 'Scope', accessorKey: 'applicationScope', enableSorting: false, cell: ({ row }) => <span className="text-xs text-ink-soft">{scopeLabel(row.original.applicationScope)}{row.original.scopeItemCount ? ` · ${row.original.scopeItemCount} selected` : ''}</span> },
    { header: 'Usage', accessorKey: 'redeemedUsageCount', enableSorting: false, cell: ({ row }) => <span>{row.original.redeemedUsageCount} / {row.original.totalUsageLimit ?? '∞'}</span> },
    { header: 'Validity', accessorKey: 'endOn', enableSorting: false, cell: ({ row }) => <div className="text-xs"><p>{new Date(row.original.startOn).toLocaleDateString('en-IN')}</p><p className="text-ink-soft">to {new Date(row.original.endOn).toLocaleDateString('en-IN')}</p></div> },
    { header: 'Status', accessorKey: 'computedStatus', enableSorting: false, cell: ({ row }) => <CouponStatusBadge status={row.original.computedStatus} /> },
    { header: '', id: 'actions', enableSorting: false, cell: ({ row }) => <div className="flex items-center gap-1"><button type="button" disabled={row.original.isDeleted} onClick={() => navigate(`/admin/coupons/${row.original.id}/edit`)} className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5 disabled:opacity-30" aria-label={`Edit ${row.original.code}`}><Pencil size={14} /></button><button type="button" disabled={row.original.isDeleted} onClick={() => setArchiveTarget(row.original)} className="rounded-full p-1.5 text-oxblood hover:bg-oxblood/5 disabled:opacity-30" aria-label={`Archive ${row.original.code}`}><Archive size={14} /></button></div> },
  ], [navigate])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4"><div><h1 className="font-display text-2xl">Coupons</h1><p className="text-sm text-ink-soft">{isLoading ? 'Loading coupons...' : `${data?.totalCount ?? 0} coupons configured`}</p></div><button type="button" onClick={() => navigate('/admin/coupons/new')} className="flex items-center gap-1.5 rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-ivory hover:bg-oxblood-deep"><Plus size={15} /> Add Coupon</button></div>
      {error ? <ServerError className="h-auto min-h-96 py-16" message={error} action={{ label: 'Retry', onClick: refresh }} /> : (
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          searchPlaceholder="Search by code or name..."
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          pageSize={20}
          isLoading={isLoading}
          loadingRows={8}
          emptyMessage="No coupons match the selected filters."
          toolbar={<CouponFilters params={urlParams} onChange={setFilter} />}
          serverPagination={{
            page: pageNumber,
            hasPreviousPage: pageNumber > 1,
            hasNextPage: Boolean(data && pageNumber < data.totalPages),
            isFetching: isLoading,
            onPageChange: page => setFilter('page', String(page)),
          }}
        />
      )}
      <ConfirmDialog open={!!archiveTarget} onOpenChange={open => !open && setArchiveTarget(null)} title="Archive this coupon?" description={`“${archiveTarget?.code ?? ''}” will no longer be redeemable. Its usage history will be preserved.`} confirmLabel={archiving ? 'Archiving...' : 'Archive'} onConfirm={() => void archiveCoupon()} />
    </div>
  )
}

function CouponFilters({ params, onChange }: { params: URLSearchParams; onChange: (name: string, value: string) => void }) {
  const className = 'rounded-full border border-ink/15 bg-ivory-dim px-3 py-1.5 text-xs text-ink outline-none'
  return <div className="flex flex-wrap gap-2">
    <select aria-label="Active state" className={className} value={params.get('active') ?? ''} onChange={event => onChange('active', event.target.value)}><option value="">Any activity</option><option value="true">Active flag</option><option value="false">Inactive flag</option></select>
    <select aria-label="Coupon status" className={className} value={params.get('status') ?? ''} onChange={event => onChange('status', event.target.value)}><option value="">Any status</option>{statuses.map(value => <option key={value} value={value}>{value === 'UsageLimitReached' ? 'Limit reached' : value}</option>)}</select>
    <select aria-label="Discount type" className={className} value={params.get('discountType') ?? ''} onChange={event => onChange('discountType', event.target.value)}><option value="">Any discount</option><option value="Percentage">Percentage</option><option value="FlatAmount">Flat amount</option><option value="FreeShipping">Free shipping</option></select>
    <select aria-label="Application scope" className={className} value={params.get('scope') ?? ''} onChange={event => onChange('scope', event.target.value)}><option value="">Any scope</option><option value="AllProducts">All products</option><option value="SpecificProducts">Specific products</option><option value="SpecificCategories">Specific categories</option></select>
  </div>
}

function scopeLabel(scope: CouponApplicationScope) {
  return scope === 'AllProducts' ? 'All products' : scope === 'SpecificProducts' ? 'Specific products' : 'Specific categories'
}
