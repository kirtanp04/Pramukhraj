export interface AdminSalesSummary {
  grossSales: number
  netRevenue: number
  totalOrders: number
  averageOrderValue: number
  totalItemsSold: number
  itemDiscounts: number
  couponDiscounts: number
  totalDiscounts: number
  shippingFeesCollected: number
  paymentProcessingFeesCollected: number
  repeatCustomerRatePercent: number
  previousPeriodRevenue: number
  revenueGrowthPercent: number
}

export interface AdminSalesTimelinePoint {
  periodKey: string
  periodLabel: string
  revenue: number
  ordersCount: number
  itemsCount: number
  discounts: number
  shipping: number
  paymentProcessingFees: number
  averageOrderValue: number
}

export interface AdminProductSale {
  productId: string
  productName: string
  categoryName: string
  unitsSold: number
  ordersCount: number
  grossRevenue: number
  netRevenue: number
  percentageOfTotal: number
}

export interface AdminCategorySale {
  categoryId: string
  categoryName: string
  unitsSold: number
  ordersCount: number
  totalRevenue: number
  percentageOfTotal: number
}

export interface AdminCouponSale {
  couponCode: string
  timesRedeemed: number
  totalDiscountAmount: number
  totalOrderRevenue: number
}

export interface AdminStateSale {
  state: string
  ordersCount: number
  totalRevenue: number
  percentageOfTotal: number
}

export interface AdminSalesReport {
  summary: AdminSalesSummary
  timeline: AdminSalesTimelinePoint[]
  productSales: AdminProductSale[]
  categorySales: AdminCategorySale[]
  couponSales: AdminCouponSale[]
  stateSales: AdminStateSale[]
  windowStart: string
  windowEnd: string
  statusFilter: string
  granularity: string
}

export type SalesDatePreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | 'this_month'
  | 'last_month'
  | 'ytd'
  | 'custom'

export type SalesGranularity = 'day' | 'week' | 'month'

export type SalesStatusFilter = 'Confirmed' | 'all'

export interface AdminSalesReportParams {
  startDate?: string
  endDate?: string
  status?: string
  granularity?: SalesGranularity
  refresh?: boolean
  format?: 'excel' | 'csv'
}

