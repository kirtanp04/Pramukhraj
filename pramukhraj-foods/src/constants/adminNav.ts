import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, BarChart3, ShoppingCart, Package, Tags, Users, Star, Ticket, Warehouse,
  Truck, RotateCcw, CreditCard, Bell, UserCog, Settings,
  Receipt, ScrollText, Activity, Database, DatabaseBackup, KeyRound, Plug, Mail, ToggleLeft, CircleHelp, MessageSquareText, ServerCog,
} from 'lucide-react'

export interface AdminNavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export interface AdminNavGroup {
  title: string
  items: AdminNavItem[]
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
      { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
      { label: 'Cache Metrics', to: '/admin/cache-metrics', icon: Database },
      { label: 'Background Metrics', to: '/admin/background-metrics', icon: Activity },
      { label: 'Server Metrics', to: '/admin/server-metrics', icon: ServerCog },
    ],
  },
  {
    title: 'Provider Credentials',
    items: [
      { label: 'Twilio (SMS)', to: '/admin/provider-credentials/twilio', icon: MessageSquareText },
      { label: 'Razorpay (Payment)', to: '/admin/provider-credentials/razorpay', icon: CreditCard },
      { label: 'Shiprocket (Shipment)', to: '/admin/provider-credentials/shiprocket', icon: Truck },
      { label: 'Email (SMTP)', to: '/admin/provider-credentials/smtp', icon: Mail },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
      { label: 'Sales Reports', to: '/admin/sales', icon: Receipt },
      { label: 'Returns & Refunds', to: '/admin/returns', icon: RotateCcw },
      { label: 'Payments', to: '/admin/payments', icon: CreditCard },
      { label: 'Shipping', to: '/admin/shipping', icon: Truck },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', to: '/admin/products', icon: Package },
      { label: 'Categories', to: '/admin/categories', icon: Tags },
      { label: 'Inventory', to: '/admin/inventory', icon: Warehouse },
      { label: 'Coupons', to: '/admin/coupons', icon: Ticket },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Customers', to: '/admin/customers', icon: Users },
      { label: 'Reviews', to: '/admin/reviews', icon: Star },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Homepage CMS', to: '/admin/cms', icon: LayoutDashboard },
      { label: 'FAQs', to: '/admin/faqs', icon: CircleHelp },
      { label: 'Email Templates', to: '/admin/email-templates', icon: Mail },
      { label: 'Notifications', to: '/admin/notifications', icon: Bell },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Admin Users', to: '/admin/users', icon: UserCog },
      { label: 'Admin Actions', to: '/admin/admin-actions?page=1', icon: ScrollText },
      { label: 'API Keys', to: '/admin/api-keys', icon: KeyRound },
      { label: 'Integrations', to: '/admin/integrations', icon: Plug },
      { label: 'Feature Flags', to: '/admin/feature-flags', icon: ToggleLeft },
      { label: 'Backups', to: '/admin/backup', icon: DatabaseBackup },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
    ],
  },
]
