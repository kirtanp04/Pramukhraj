import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { adminUsers } from '@/mock/adminUsers'
import { getRole, roleHasPermission } from '@/mock/roles'
import { initialAuditLog } from '@/mock/auditLog'
import type { AdminUser, AuditLogEntry, Permission } from '@/types/admin'

interface AuthState {
  user: AdminUser | null
  isAuthenticated: boolean
  auditLog: AuditLogEntry[]
  loginError: string | null
  login: (email: string, password: string) => boolean
  logout: () => void
  hasPermission: (permission: Permission) => boolean
  logAction: (action: string, target: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      auditLog: initialAuditLog,
      loginError: null,

      login: (email, password) => {
        const found = adminUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
        if (!found) {
          set({ loginError: 'No admin account found with that email.' })
          return false
        }
        if (found.status === 'Suspended') {
          set({ loginError: 'This account has been suspended. Contact a Super Admin.' })
          return false
        }
        if (found.password !== password) {
          set({ loginError: 'Incorrect password. Please try again.' })
          return false
        }
        set({
          user: { ...found, lastLogin: new Date().toISOString() },
          isAuthenticated: true,
          loginError: null,
        })
        get().logAction('Logged in', found.email)
        return true
      },

      logout: () => {
        const email = get().user?.email
        set({ user: null, isAuthenticated: false })
        if (email) get().logAction('Logged out', email)
      },

      hasPermission: (permission) => {
        const user = get().user
        if (!user) return false
        return roleHasPermission(getRole(user.roleId), permission)
      },

      logAction: (action, target) => {
        const user = get().user
        set({
          auditLog: [
            {
              id: `log-${Date.now()}`,
              actor: user?.name ?? 'System',
              action,
              target,
              timestamp: new Date().toISOString(),
              ip: '127.0.0.1',
            },
            ...get().auditLog,
          ],
        })
      },
    }),
    { name: 'pramukhraj-admin-auth' },
  ),
)
