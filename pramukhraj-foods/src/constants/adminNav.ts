import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, BarChart3, ShoppingCart, Package, Tags, Users, Star, Ticket, Warehouse,
  Truck, RotateCcw, CreditCard, Bell, Image, ShieldCheck, UserCog, Settings,
  Receipt, ScrollText, Activity, DatabaseBackup, KeyRound, Plug, Mail, ToggleLeft, BookOpen,
} from 'lucide-react'
import type { Permission } from '@/types/admin'

export interface AdminNavItem {
  label: string
  to: string
  icon: LucideIcon
  permission: Permission
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
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, permission: 'dashboard.view', end: true },
      { label: 'Analytics', to: '/admin/analytics', icon: BarChart3, permission: 'analytics.view' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', to: '/admin/orders', icon: ShoppingCart, permission: 'orders.view' },
      { label: 'Sales Reports', to: '/admin/sales', icon: Receipt, permission: 'sales.view' },
      { label: 'Returns & Refunds', to: '/admin/returns', icon: RotateCcw, permission: 'returns.view' },
      { label: 'Payments', to: '/admin/payments', icon: CreditCard, permission: 'payments.view' },
      { label: 'Shipping', to: '/admin/shipping', icon: Truck, permission: 'payments.view' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', to: '/admin/products', icon: Package, permission: 'products.view' },
      { label: 'Categories & Brands', to: '/admin/categories', icon: Tags, permission: 'categories.view' },
      { label: 'Inventory', to: '/admin/inventory', icon: Warehouse, permission: 'inventory.view' },
      { label: 'Coupons', to: '/admin/coupons', icon: Ticket, permission: 'coupons.view' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Customers', to: '/admin/customers', icon: Users, permission: 'customers.view' },
      { label: 'Reviews', to: '/admin/reviews', icon: Star, permission: 'reviews.view' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Homepage CMS', to: '/admin/cms', icon: LayoutDashboard, permission: 'cms.view' },
      { label: 'Blog', to: '/admin/blog', icon: BookOpen, permission: 'blog.view' },
      { label: 'Media Library', to: '/admin/media', icon: Image, permission: 'media.view' },
      { label: 'Email Templates', to: '/admin/email-templates', icon: Mail, permission: 'cms.view' },
      { label: 'Notifications', to: '/admin/notifications', icon: Bell, permission: 'cms.view' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Roles & Permissions', to: '/admin/roles', icon: ShieldCheck, permission: 'roles.view' },
      { label: 'Admin Users', to: '/admin/users', icon: UserCog, permission: 'users.view' },
      { label: 'Audit Logs', to: '/admin/audit-logs', icon: ScrollText, permission: 'settings.view' },
      { label: 'System Health', to: '/admin/system-health', icon: Activity, permission: 'settings.view' },
      { label: 'API Keys', to: '/admin/api-keys', icon: KeyRound, permission: 'settings.view' },
      { label: 'Integrations', to: '/admin/integrations', icon: Plug, permission: 'settings.view' },
      { label: 'Feature Flags', to: '/admin/feature-flags', icon: ToggleLeft, permission: 'settings.view' },
      { label: 'Backups', to: '/admin/backup', icon: DatabaseBackup, permission: 'settings.manage' },
      { label: 'Settings', to: '/admin/settings', icon: Settings, permission: 'settings.view' },
    ],
  },
]
