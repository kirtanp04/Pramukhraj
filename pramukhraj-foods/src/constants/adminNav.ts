import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, BarChart3, ShoppingCart, Package, Tags, Users, Star, Ticket, Warehouse,
  Truck, RotateCcw, CreditCard, Bell, Image, UserCog, Settings,
  Receipt, ScrollText, Activity, DatabaseBackup, KeyRound, Plug, Mail, ToggleLeft, BookOpen,
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
      { label: 'Blog', to: '/admin/blog', icon: BookOpen },
      { label: 'Media Library', to: '/admin/media', icon: Image },
      { label: 'Email Templates', to: '/admin/email-templates', icon: Mail },
      { label: 'Notifications', to: '/admin/notifications', icon: Bell },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Admin Users', to: '/admin/users', icon: UserCog },
      { label: 'Admin Actions', to: '/admin/admin-actions?page=1', icon: ScrollText },
      { label: 'System Health', to: '/admin/system-health', icon: Activity },
      { label: 'API Keys', to: '/admin/api-keys', icon: KeyRound },
      { label: 'Integrations', to: '/admin/integrations', icon: Plug },
      { label: 'Feature Flags', to: '/admin/feature-flags', icon: ToggleLeft },
      { label: 'Backups', to: '/admin/backup', icon: DatabaseBackup },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
    ],
  },
]
