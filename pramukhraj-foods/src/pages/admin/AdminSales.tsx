import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { orders, categories } from '@/mock'
import { formatINR } from '@/lib/utils'
import { StatCard } from '@/components/admin/StatCard'
import { DataTable } from '@/components/admin/DataTable'
import { IndianRupee, Receipt, TrendingUp } from 'lucide-react'

interface CategorySale { category: string; orders: number; revenue: number }

export function AdminSales() {
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
  const avgOrderValue = Math.round(totalRevenue / Math.max(1, orders.length))

  const byCategory: CategorySale[] = useMemo(() => categories.slice(0, 10).map((c) => ({
    category: c.name,
    orders: Math.floor(Math.random() * 400) + 40,
    revenue: Math.floor(Math.random() * 250000) + 20000,
  })), [])

  const columns: ColumnDef<CategorySale, any>[] = [
    { header: 'Category', accessorKey: 'category' },
    { header: 'Orders', accessorKey: 'orders' },
    { header: 'Revenue', accessorKey: 'revenue', cell: ({ row }) => <span className="font-mono">{formatINR(row.original.revenue)}</span> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Sales Reports</h1>
        <p className="text-sm text-ink-soft">Revenue performance across the catalog.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Revenue (sample orders)" value={formatINR(totalRevenue)} icon={IndianRupee} change="+12.4%" />
        <StatCard label="Avg. Order Value" value={formatINR(avgOrderValue)} icon={Receipt} change="+3.1%" />
        <StatCard label="Repeat Purchase Rate" value="38%" icon={TrendingUp} change="+2.0%" />
      </div>
      <DataTable columns={columns} data={byCategory} searchPlaceholder="Search category..." pageSize={10} />
    </div>
  )
}
