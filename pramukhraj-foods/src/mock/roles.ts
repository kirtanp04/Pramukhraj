import type { Role, Permission } from '@/types/admin'

// Modules covered by the permission system, grouped for the Roles & Permissions UI.
export const PERMISSION_RESOURCES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'orders', label: 'Orders' },
  { key: 'products', label: 'Products' },
  { key: 'categories', label: 'Categories & Brands' },
  { key: 'customers', label: 'Customers' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'inventory', label: 'Inventory & Warehouse' },
  { key: 'returns', label: 'Returns & Refunds' },
  { key: 'payments', label: 'Payments & Shipping' },
  { key: 'cms', label: 'CMS & Homepage' },
  { key: 'blog', label: 'Blog' },
  { key: 'media', label: 'Media Library' },
  { key: 'sales', label: 'Sales & Reports' },
  { key: 'roles', label: 'Roles & Permissions' },
  { key: 'users', label: 'Admin Users' },
  { key: 'settings', label: 'Settings & System' },
] as const

export const roles: Role[] = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Full, unrestricted access to every module, including roles and system settings.',
    permissions: ['*'],
    color: 'oxblood',
  },
  {
    id: 'catalog-manager',
    name: 'Catalog Manager',
    description: 'Manages products, categories, brands, inventory and coupons.',
    permissions: [
      'dashboard.view', 'products.*', 'categories.*', 'inventory.*', 'coupons.*', 'reviews.view', 'media.*',
    ],
    color: 'turmeric',
  },
  {
    id: 'order-support-manager',
    name: 'Order & Support Manager',
    description: 'Handles orders, customers, returns, refunds and shipping.',
    permissions: [
      'dashboard.view', 'orders.*', 'customers.*', 'returns.*', 'payments.view', 'reviews.*',
    ],
    color: 'teal',
  },
  {
    id: 'content-editor',
    name: 'Content Editor',
    description: 'Owns the homepage CMS, blog and media library.',
    permissions: ['dashboard.view', 'cms.*', 'blog.*', 'media.*'],
    color: 'soft',
  },
  {
    id: 'finance-viewer',
    name: 'Finance & Reports Viewer',
    description: 'Read-only access to sales, payments and reporting data.',
    permissions: ['dashboard.view', 'sales.view', 'analytics.view', 'payments.view'],
    color: 'soft',
  },
]

export function getRole(roleId: string): Role | undefined {
  return roles.find((r) => r.id === roleId)
}

export function roleHasPermission(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  if (role.permissions.includes('*')) return true
  const [resource] = permission.split('.')
  return role.permissions.includes(permission) || role.permissions.includes(`${resource}.*`)
}
