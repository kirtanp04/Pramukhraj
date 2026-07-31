import { useState } from 'react'
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel,
  useReactTable, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[]
  data: T[]
  searchPlaceholder?: string
  toolbar?: React.ReactNode
  pageSize?: number
}

export function DataTable<T>({ columns, data, searchPlaceholder = 'Search...', toolbar, pageSize = 8 }: DataTableProps<T>) {
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
    <div className="rounded-card border border-ink/10 bg-ivory">
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
            {table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-ink-soft">No results found.</td></tr>
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

      <div className="flex items-center justify-between gap-3 border-t border-ink/10 px-4 py-3 text-xs text-ink-soft">
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())} · {table.getFilteredRowModel().rows.length} results
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-full p-1.5 hover:bg-ink/5 disabled:opacity-30">
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-full p-1.5 hover:bg-ink/5 disabled:opacity-30">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
