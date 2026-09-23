import { useState, useMemo, useRef, useEffect } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  IndianRupee,
  ShoppingBag,
  Receipt,
  Package,
  Tag,
  Truck,
  CreditCard,
  Users,
  RefreshCw,
  RotateCcw,
  Calendar,
  Layers,
  ShoppingBasket,
  PieChart as PieChartIcon,
  Ticket,
  MapPin,
  AlertCircle,
  Database,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react'

import { formatINR, cn } from '@/lib/utils'
import { StatCard } from '@/components/admin/StatCard'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAdminSalesReport } from '@/features/sales/hooks/useAdminSalesReport'
import type {
  AdminSalesTimelinePoint,
  AdminProductSale,
  AdminCategorySale,
  AdminCouponSale,
  AdminStateSale,
  SalesDatePreset,
  SalesGranularity,
} from '@/features/sales/types/sales.types'

const PRESET_OPTIONS: { id: SalesDatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'ytd', label: 'Year-to-Date' },
  { id: 'custom', label: 'Custom' },
]

const GRANULARITY_OPTIONS: { id: SalesGranularity; label: string }[] = [
  { id: 'day', label: 'Daily' },
  { id: 'week', label: 'Weekly' },
  { id: 'month', label: 'Monthly' },
]

const CHART_PALETTE = [
  '#dc2626', // oxblood
  '#1d4ed8', // teal / royal blue
  '#60a5fa', // turmeric / sky blue
  '#991b1b', // oxblood deep
  '#2563eb', // turmeric deep
  '#0d9488', // teal accent
  '#f59e0b', // amber
  '#8b5cf6', // purple
]

type ActiveTab = 'ledger' | 'products' | 'categories' | 'coupons' | 'regions'

export function AdminSales() {
  const {
    preset,
    setPreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    granularity,
    setGranularity,
    status,
    setStatus,
    report,
    isLoading,
    isRefreshing,
    isExporting,
    error,
    refresh,
    clearCache,
    exportExcel,
    exportCsv,
  } = useAdminSalesReport()

  const [activeTab, setActiveTab] = useState<ActiveTab>('ledger')
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false)
      }
    }
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExportMenuOpen])

  // ─── Table Column Definitions ───────────────────────────────────────────────

  const ledgerColumns: ColumnDef<AdminSalesTimelinePoint, any>[] = useMemo(
    () => [
      {
        header: 'Period',
        accessorKey: 'periodLabel',
        cell: ({ row }) => (
          <span className="font-semibold text-ink">{row.original.periodLabel}</span>
        ),
      },
      {
        header: 'Orders',
        accessorKey: 'ordersCount',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.ordersCount}</span>
        ),
      },
      {
        header: 'Items Sold',
        accessorKey: 'itemsCount',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.itemsCount}</span>
        ),
      },
      {
        header: 'Discounts',
        accessorKey: 'discounts',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-ink-soft">
            {formatINR(row.original.discounts)}
          </span>
        ),
      },
      {
        header: 'Shipping',
        accessorKey: 'shipping',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-ink-soft">
            {formatINR(row.original.shipping)}
          </span>
        ),
      },
      {
        header: 'Payment Fees',
        accessorKey: 'paymentProcessingFees',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-ink-soft">
            {formatINR(row.original.paymentProcessingFees)}
          </span>
        ),
      },
      {
        header: 'Net Revenue',
        accessorKey: 'revenue',
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-oxblood">
            {formatINR(row.original.revenue)}
          </span>
        ),
      },
      {
        header: 'AOV',
        accessorKey: 'averageOrderValue',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{formatINR(row.original.averageOrderValue)}</span>
        ),
      },
    ],
    []
  )

  const productColumns: ColumnDef<AdminProductSale, any>[] = useMemo(
    () => [
      {
        header: 'Product Name',
        accessorKey: 'productName',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-ink">{row.original.productName}</p>
            <p className="text-xs text-ink-soft">{row.original.categoryName}</p>
          </div>
        ),
      },
      {
        header: 'Units Sold',
        accessorKey: 'unitsSold',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.unitsSold}</span>
        ),
      },
      {
        header: 'Orders',
        accessorKey: 'ordersCount',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.ordersCount}</span>
        ),
      },
      {
        header: 'Gross Revenue',
        accessorKey: 'grossRevenue',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-ink-soft">
            {formatINR(row.original.grossRevenue)}
          </span>
        ),
      },
      {
        header: 'Net Revenue',
        accessorKey: 'netRevenue',
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-oxblood">
            {formatINR(row.original.netRevenue)}
          </span>
        ),
      },
      {
        header: 'Share (%)',
        accessorKey: 'percentageOfTotal',
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-full bg-turmeric/15 px-2 py-0.5 font-mono text-xs font-medium text-teal-deep">
            {row.original.percentageOfTotal.toFixed(1)}%
          </span>
        ),
      },
    ],
    []
  )

  const categoryColumns: ColumnDef<AdminCategorySale, any>[] = useMemo(
    () => [
      {
        header: 'Category',
        accessorKey: 'categoryName',
        cell: ({ row }) => (
          <span className="font-semibold text-ink">{row.original.categoryName}</span>
        ),
      },
      {
        header: 'Units Sold',
        accessorKey: 'unitsSold',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.unitsSold}</span>
        ),
      },
      {
        header: 'Orders',
        accessorKey: 'ordersCount',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.ordersCount}</span>
        ),
      },
      {
        header: 'Total Revenue',
        accessorKey: 'totalRevenue',
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-oxblood">
            {formatINR(row.original.totalRevenue)}
          </span>
        ),
      },
      {
        header: 'Share (%)',
        accessorKey: 'percentageOfTotal',
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-full bg-turmeric/15 px-2 py-0.5 font-mono text-xs font-medium text-teal-deep">
            {row.original.percentageOfTotal.toFixed(1)}%
          </span>
        ),
      },
    ],
    []
  )

  const couponColumns: ColumnDef<AdminCouponSale, any>[] = useMemo(
    () => [
      {
        header: 'Coupon Code',
        accessorKey: 'couponCode',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 bg-ivory px-2.5 py-1 font-mono text-xs font-semibold text-ink">
            <Ticket size={12} className="text-oxblood" />
            {row.original.couponCode}
          </span>
        ),
      },
      {
        header: 'Redemptions',
        accessorKey: 'timesRedeemed',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.timesRedeemed}</span>
        ),
      },
      {
        header: 'Total Discount Given',
        accessorKey: 'totalDiscountAmount',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-oxblood">
            {formatINR(row.original.totalDiscountAmount)}
          </span>
        ),
      },
      {
        header: 'Order Revenue Generated',
        accessorKey: 'totalOrderRevenue',
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-ink">
            {formatINR(row.original.totalOrderRevenue)}
          </span>
        ),
      },
    ],
    []
  )

  const stateColumns: ColumnDef<AdminStateSale, any>[] = useMemo(
    () => [
      {
        header: 'State / Region',
        accessorKey: 'state',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <MapPin size={14} className="text-teal" />
            {row.original.state}
          </div>
        ),
      },
      {
        header: 'Orders',
        accessorKey: 'ordersCount',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.ordersCount}</span>
        ),
      },
      {
        header: 'Total Revenue',
        accessorKey: 'totalRevenue',
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-oxblood">
            {formatINR(row.original.totalRevenue)}
          </span>
        ),
      },
      {
        header: 'Share (%)',
        accessorKey: 'percentageOfTotal',
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-full bg-turmeric/15 px-2 py-0.5 font-mono text-xs font-medium text-teal-deep">
            {row.original.percentageOfTotal.toFixed(1)}%
          </span>
        ),
      },
    ],
    []
  )

  // ─── Chart Data Transformations ─────────────────────────────────────────────

  const categoryPieData = useMemo(() => {
    if (!report?.categorySales || report.categorySales.length === 0) return []
    return report.categorySales.map((c) => ({
      name: c.categoryName,
      value: c.totalRevenue,
    }))
  }, [report?.categorySales])

  const summary = report?.summary

  return (
    <div className="space-y-6">
      {/* ─── Page Header & Description ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-ink">Sales Reports</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-turmeric/15 px-2 py-0.5 text-[11px]! font-medium text-teal-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              Live Cache Active
            </span>
          </div>
          <p className="text-sm! text-ink-soft">
            Real-time store performance, revenue intelligence, and accounting audit breakdown.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Clear Cache Button */}
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing || isLoading}
            onClick={() => void clearCache()}
            className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-oxblood"
            title="Purge in-memory sales cache across all buckets"
          >
            <Database size={13} />
            <span className="hidden sm:inline">Purge Cache</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing || isLoading}
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5"
            title="Bypass cache and pull latest PostgreSQL sales data"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Smart Export Dropdown Button */}
          <div className="relative inline-block text-left" ref={exportMenuRef}>
            <div className="inline-flex items-center rounded-md shadow-xs">
              <Button
                variant="primary"
                size="sm"
                disabled={isExporting || isLoading}
                onClick={() => void exportExcel()}
                className="inline-flex items-center gap-1.5 rounded-r-none border-r border-white/20"
                title="Export styled Excel workbook with store branding, KPI cards, and colored tables"
              >
                <FileSpreadsheet size={14} className={isExporting ? 'animate-bounce' : ''} />
                <span>{isExporting ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isExporting || isLoading}
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="rounded-l-none px-2"
                title="Choose export format (Excel or CSV)"
                aria-haspopup="true"
                aria-expanded={isExportMenuOpen}
              >
                <ChevronDown size={14} className={cn('transition-transform duration-200', isExportMenuOpen && 'rotate-180')} />
              </Button>
            </div>

            {isExportMenuOpen && (
              <div className="absolute right-0 z-50 mt-1.5 w-72 origin-top-right rounded-lg border border-ink/10 bg-ivory p-1.5 shadow-lg ring-1 ring-black/5">
                <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  Export Report Formats
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false)
                    void exportExcel()
                  }}
                  className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-xs! transition-colors hover:bg-turmeric/15"
                >
                  <FileSpreadsheet size={16} className="mt-0.5 shrink-0 text-teal-deep" />
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-ink">
                      Excel Spreadsheet (.xlsx)
                      <span className="rounded bg-oxblood/10 px-1 py-0.2 text-[10px]! font-semibold text-oxblood">Recommended</span>
                    </div>
                    <p className="mt-0.5 text-[11px]! text-ink-soft">
                      Includes store branding, colored financial highlights, and styled tables.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false)
                    void exportCsv()
                  }}
                  className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left text-xs! transition-colors hover:bg-turmeric/15"
                >
                  <FileText size={16} className="mt-0.5 shrink-0 text-oxblood" />
                  <div>
                    <div className="font-semibold text-ink">CSV Spreadsheet (.csv)</div>
                    <p className="mt-0.5 text-[11px]! text-ink-soft">
                      Clean unencrypted UTF-8 text with store branding summary and ledger breakdown.
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Control Bar: Date Presets, Granularity, Status Filter ─────────────── */}
      <div className="rounded-card border border-ink/10 bg-ivory p-4 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink-soft">
              <Calendar size={13} />
              Period:
            </span>
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreset(opt.id)}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  preset === opt.id
                    ? 'bg-oxblood text-ivory shadow-xs font-semibold'
                    : 'bg-ivory border border-ink/15 text-ink-soft hover:bg-ink/5 hover:text-ink'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Secondary Controls: Granularity & Order Status */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Granularity Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-ink-soft">Bucket:</span>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as SalesGranularity)}
                className="h-8 rounded-lg border border-ink/15 bg-ivory px-2 text-xs font-medium text-ink focus:border-oxblood focus:outline-hidden"
              >
                {GRANULARITY_OPTIONS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-ink-soft">Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Confirmed' | 'all')}
                className="h-8 rounded-lg border border-ink/15 bg-ivory px-2 text-xs font-medium text-ink focus:border-oxblood focus:outline-hidden"
              >
                <option value="Confirmed">Confirmed (Paid)</option>
                <option value="all">All Orders</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Date Pickers (Shown only when preset === 'custom') */}
        {preset === 'custom' && (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-3">
            <div className="flex items-center gap-2">
              <label htmlFor="sales-start-date" className="text-xs font-semibold text-ink-soft">
                From:
              </label>
              <input
                id="sales-start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 rounded-lg border border-ink/15 bg-ivory px-2 text-xs text-ink focus:border-oxblood focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sales-end-date" className="text-xs font-semibold text-ink-soft">
                To:
              </label>
              <input
                id="sales-end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 rounded-lg border border-ink/15 bg-ivory px-2 text-xs text-ink focus:border-oxblood focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Error State ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between rounded-card border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-oxblood" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Retry
          </Button>
        </div>
      )}

      {/* ─── KPI Financial StatCards ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-card border border-ink/10 bg-ivory p-5 space-y-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Net Revenue"
            value={formatINR(summary.netRevenue)}
            icon={IndianRupee}
            change={`${summary.revenueGrowthPercent >= 0 ? '+' : ''}${summary.revenueGrowthPercent.toFixed(1)}% vs prev period`}
            positive={summary.revenueGrowthPercent >= 0}
          />
          <StatCard
            label="Total Orders"
            value={summary.totalOrders.toLocaleString()}
            icon={ShoppingBag}
            change={`${summary.totalOrders > 0 ? (summary.totalItemsSold / summary.totalOrders).toFixed(1) : '0'} items / order`}
            positive={true}
          />
          <StatCard
            label="Average Order Value"
            value={formatINR(summary.averageOrderValue)}
            icon={Receipt}
          />
          <StatCard
            label="Units Sold"
            value={summary.totalItemsSold.toLocaleString()}
            icon={Package}
          />
          <StatCard
            label="Repeat Customer Rate"
            value={`${summary.repeatCustomerRatePercent.toFixed(1)}%`}
            icon={Users}
            change="Loyalty index"
            positive={summary.repeatCustomerRatePercent > 20}
          />
          <StatCard
            label="Total Refunds Issued"
            value={formatINR(summary.totalRefunds ?? 0)}
            icon={RotateCcw}
            change="Deducted from gross"
            positive={false}
          />
          <StatCard
            label="Return Rate"
            value={`${(summary.returnRatePercent ?? 0).toFixed(1)}%`}
            icon={RotateCcw}
            change={`${summary.totalReturnsCount ?? 0} return requests`}
            positive={(summary.returnRatePercent ?? 0) < 5}
          />
          <StatCard
            label="Total Discounts Given"
            value={formatINR(summary.totalDiscounts)}
            icon={Tag}
          />
          <StatCard
            label="Shipping Fees Collected"
            value={formatINR(summary.shippingFeesCollected)}
            icon={Truck}
          />
          <StatCard
            label="Payment Processing Fees"
            value={formatINR(summary.paymentProcessingFeesCollected)}
            icon={CreditCard}
          />
        </div>
      ) : null}

      {/* ─── Visual Charts ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timeline Area & Line Chart */}
        <div className="rounded-card border border-ink/10 bg-ivory p-5 lg:col-span-2 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Revenue & Order Volume Trend</h2>
              <p className="text-xs text-ink-soft">
                Continuous timeline performance with zero-filled non-active intervals.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-oxblood" /> Net Revenue
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-teal" /> Orders
              </span>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-72 w-full rounded-lg" />
          ) : report?.timeline && report.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={report.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="periodLabel"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#1d4ed8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as AdminSalesTimelinePoint
                      return (
                        <div className="rounded-lg border border-ink/15 bg-white p-3 shadow-md text-xs">
                          <p className="font-semibold text-ink">{data.periodLabel}</p>
                          <div className="mt-1.5 space-y-1 font-mono">
                            <p className="text-oxblood font-medium">
                              Net Revenue: {formatINR(data.revenue)}
                            </p>
                            <p className="text-teal">Orders: {data.ordersCount}</p>
                            <p className="text-ink-soft">Units: {data.itemsCount}</p>
                            <p className="text-ink-soft">AOV: {formatINR(data.averageOrderValue)}</p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#dc2626"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#salesRevenueGradient)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ordersCount"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#1d4ed8' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-72 items-center justify-center text-xs text-ink-soft">
              No sales data recorded for the selected window.
            </div>
          )}
        </div>

        {/* Category Revenue Distribution Donut */}
        <div className="rounded-card border border-ink/10 bg-ivory p-5 shadow-xs">
          <div className="mb-4">
            <h2 className="font-display text-lg font-bold text-ink">Category Revenue Share</h2>
            <p className="text-xs text-ink-soft">Catalog category revenue contribution.</p>
          </div>

          {isLoading ? (
            <Skeleton className="h-72 w-full rounded-lg" />
          ) : categoryPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={290}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categoryPieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatINR(Number(value) || 0), 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-ink">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-72 items-center justify-center text-xs text-ink-soft">
              No category data available.
            </div>
          )}
        </div>
      </div>

      {/* ─── Multi-Tab Detailed Ledger & Analytics ─────────────────────────────── */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-ink/10 pb-px">
          <nav className="flex gap-2" aria-label="Sales breakdown tabs">
            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={cn(
                'inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm',
                activeTab === 'ledger'
                  ? 'border-oxblood bg-ivory text-oxblood shadow-xs'
                  : 'border-transparent text-ink-soft hover:border-ink/20 hover:text-ink'
              )}
            >
              <Layers size={15} />
              <span>Ledger Over Time</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={cn(
                'inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm',
                activeTab === 'products'
                  ? 'border-oxblood bg-ivory text-oxblood shadow-xs'
                  : 'border-transparent text-ink-soft hover:border-ink/20 hover:text-ink'
              )}
            >
              <ShoppingBasket size={15} />
              <span>Sales by Product ({report?.productSales?.length ?? 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={cn(
                'inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm',
                activeTab === 'categories'
                  ? 'border-oxblood bg-ivory text-oxblood shadow-xs'
                  : 'border-transparent text-ink-soft hover:border-ink/20 hover:text-ink'
              )}
            >
              <PieChartIcon size={15} />
              <span>Sales by Category ({report?.categorySales?.length ?? 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('coupons')}
              className={cn(
                'inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm',
                activeTab === 'coupons'
                  ? 'border-oxblood bg-ivory text-oxblood shadow-xs'
                  : 'border-transparent text-ink-soft hover:border-ink/20 hover:text-ink'
              )}
            >
              <Ticket size={15} />
              <span>Coupons ({report?.couponSales?.length ?? 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('regions')}
              className={cn(
                'inline-flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors sm:text-sm',
                activeTab === 'regions'
                  ? 'border-oxblood bg-ivory text-oxblood shadow-xs'
                  : 'border-transparent text-ink-soft hover:border-ink/20 hover:text-ink'
              )}
            >
              <MapPin size={15} />
              <span>State Distribution ({report?.stateSales?.length ?? 0})</span>
            </button>
          </nav>
        </div>

        {/* Tab Content Tables */}
        {activeTab === 'ledger' && (
          <DataTable
            columns={ledgerColumns}
            data={report?.timeline ?? []}
            searchPlaceholder="Search timeline periods..."
            pageSize={10}
            isLoading={isLoading}
            emptyMessage="No ledger data found for the selected period."
          />
        )}

        {activeTab === 'products' && (
          <DataTable
            columns={productColumns}
            data={report?.productSales ?? []}
            searchPlaceholder="Search products or categories..."
            pageSize={10}
            isLoading={isLoading}
            emptyMessage="No product sales recorded in this interval."
          />
        )}

        {activeTab === 'categories' && (
          <DataTable
            columns={categoryColumns}
            data={report?.categorySales ?? []}
            searchPlaceholder="Search categories..."
            pageSize={10}
            isLoading={isLoading}
            emptyMessage="No category sales found in this interval."
          />
        )}

        {activeTab === 'coupons' && (
          <DataTable
            columns={couponColumns}
            data={report?.couponSales ?? []}
            searchPlaceholder="Search coupons..."
            pageSize={10}
            isLoading={isLoading}
            emptyMessage="No coupons were redeemed during this period."
          />
        )}

        {activeTab === 'regions' && (
          <DataTable
            columns={stateColumns}
            data={report?.stateSales ?? []}
            searchPlaceholder="Search state or region..."
            pageSize={10}
            isLoading={isLoading}
            emptyMessage="No regional order distribution recorded."
          />
        )}
      </div>
    </div>
  )
}
export default AdminSales
