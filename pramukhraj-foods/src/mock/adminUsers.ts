import type { AdminUser } from '@/types/admin'

// Demo credentials — password is the same for every seed account so it's easy to try each role.
export const DEMO_PASSWORD = 'admin123'

export const adminUsers: AdminUser[] = [
  {
    id: 'au-1',
    name: 'Riya Kapoor',
    email: 'superadmin@pramukhraj.com',
    password: DEMO_PASSWORD,
    avatar: 'https://i.pravatar.cc/100?u=riya-kapoor',
    roleId: 'super-admin',
    status: 'Active',
    lastLogin: '2026-07-28T09:12:00.000Z',
  },
  {
    id: 'au-2',
    name: 'Karan Mehta',
    email: 'catalog@pramukhraj.com',
    password: DEMO_PASSWORD,
    avatar: 'https://i.pravatar.cc/100?u=karan-mehta',
    roleId: 'catalog-manager',
    status: 'Active',
    lastLogin: '2026-07-27T14:40:00.000Z',
  },
  {
    id: 'au-3',
    name: 'Neha Joshi',
    email: 'support@pramukhraj.com',
    password: DEMO_PASSWORD,
    avatar: 'https://i.pravatar.cc/100?u=neha-joshi',
    roleId: 'order-support-manager',
    status: 'Active',
    lastLogin: '2026-07-29T07:05:00.000Z',
  },
  {
    id: 'au-4',
    name: 'Aditi Rao',
    email: 'content@pramukhraj.com',
    password: DEMO_PASSWORD,
    avatar: 'https://i.pravatar.cc/100?u=aditi-rao',
    roleId: 'content-editor',
    status: 'Active',
    lastLogin: '2026-07-26T11:22:00.000Z',
  },
  {
    id: 'au-5',
    name: 'Vivek Nair',
    email: 'finance@pramukhraj.com',
    password: DEMO_PASSWORD,
    avatar: 'https://i.pravatar.cc/100?u=vivek-nair',
    roleId: 'finance-viewer',
    status: 'Active',
    lastLogin: '2026-07-20T16:00:00.000Z',
  },
  {
    id: 'au-6',
    name: 'Sameer Bhatt',
    email: 'sameer.bhatt@pramukhraj.com',
    password: DEMO_PASSWORD,
    avatar: 'https://i.pravatar.cc/100?u=sameer-bhatt',
    roleId: 'catalog-manager',
    status: 'Suspended',
    lastLogin: '2026-05-02T10:15:00.000Z',
  },
]
