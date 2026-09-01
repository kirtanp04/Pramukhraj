import { useState } from 'react'
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
  useReactTable, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, LoaderCircle, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

interface ServerPaginationOptions {
  page: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  isFetching?: boolean
  onPageChange: (page: number) => void
}

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[]
  data: T[]
  searchPlaceholder?: string
  toolbar?: React.ReactNode
  pageSize?: number
  isLoading?: boolean
  loadingRows?: number
  emptyMessage?: string
  serverPagination?: ServerPaginationOptions
  hideFooter?: boolean
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  toolbar,
  pageSize = 8,
  isLoading = false,
  loadingRows = pageSize,
  emptyMessage = 'No results found.',
  serverPagination,
  hideFooter = false,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  return (
    <div
      className="rounded-card border border-ink/10 bg-ivory"
      aria-busy={isLoading || serverPagination?.isFetching}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-ink/10 p-4">
        <div className="flex min-w-52 flex-1 items-center gap-2 rounded-full border border-ink/15 bg-ivory-dim px-3 py-1.5">
          <Search size={14} className="text-ink-soft" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/60"
          />
        </div>
        {toolbar}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink-soft">
                {hg.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-4 py-3 font-medium">
                    {header.isPlaceholder ? null : (
                      <button
                        className={cn('flex items-center gap-1', header.column.getCanSort() && 'cursor-pointer select-none')}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ChevronUp size={12} />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown size={12} />}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: loadingRows }, (_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-ink/5 last:border-0">
                  {columns.map((_, columnIndex) => (
                    <td key={columnIndex} className="px-4 py-3">
                      <Skeleton className={cn('h-5', columnIndex === 0 ? 'w-40' : 'w-24')} />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-ink-soft">{emptyMessage}</td></tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-ink/5 last:border-0 hover:bg-ivory-dim/60">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!hideFooter && <div className="flex items-center justify-between gap-3 border-t border-ink/10 px-4 py-3 text-xs text-ink-soft">
        <span className="flex items-center gap-2">
          {serverPagination
            ? `Page ${serverPagination.page} · ${table.getFilteredRowModel().rows.length} results on this page`
            : `Page ${table.getState().pagination.pageIndex + 1} of ${Math.max(1, table.getPageCount())} · ${table.getFilteredRowModel().rows.length} results`}
          {serverPagination?.isFetching && (
            <LoaderCircle size={13} className="animate-spin" aria-label="Loading page" />
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => serverPagination
              ? serverPagination.onPageChange(serverPagination.page - 1)
              : table.previousPage()}
            disabled={serverPagination
              ? !serverPagination.hasPreviousPage || serverPagination.isFetching
              : !table.getCanPreviousPage()}
            className="rounded-full p-1.5 hover:bg-ink/5 disabled:opacity-30"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            aria-label="Next page"
            onClick={() => serverPagination
              ? serverPagination.onPageChange(serverPagination.page + 1)
              : table.nextPage()}
            disabled={serverPagination
              ? !serverPagination.hasNextPage || serverPagination.isFetching
              : !table.getCanNextPage()}
            className="rounded-full p-1.5 hover:bg-ink/5 disabled:opacity-30"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>}
    </div>
  )
}
