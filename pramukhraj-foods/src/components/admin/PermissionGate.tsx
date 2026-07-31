import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getRole } from '@/mock/roles'
import type { Permission } from '@/types/admin'

export function PermissionGate({ permission, children }: { permission: Permission; children: ReactNode }) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const roleId = useAuthStore((s) => s.user?.roleId)
  const role = getRole(roleId ?? '')

  if (!hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center rounded-card border border-dashed border-ink/15 py-20 text-center">
        <ShieldAlert size={34} className="text-oxblood" />
        <p className="mt-3 font-display text-xl">Access Restricted</p>
        <p className="mt-1 max-w-sm text-sm text-ink-soft">
          Your role ({role?.name ?? 'Unknown'}) doesn't have permission to view this module.
          Ask a Super Admin to update your access under Roles &amp; Permissions.
        </p>
      </div>
    )
  }
  return <>{children}</>
}
