import { useState } from 'react'
import { Check, Info } from 'lucide-react'
import { roles as initialRoles, PERMISSION_RESOURCES, roleHasPermission } from '@/mock/roles'
import type { Role } from '@/types/admin'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

export function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>(initialRoles)
  const canManage = useAuthStore((s) => s.hasPermission('roles.manage'))
  const logAction = useAuthStore((s) => s.logAction)

  function toggle(role: Role, resourceKey: string) {
    if (!canManage || role.permissions.includes('*')) return
    const perm = `${resourceKey}.*`
    const has = roleHasPermission(role, `${resourceKey}.view`)
    setRoles((prev) => prev.map((r) => {
      if (r.id !== role.id) return r
      const permissions = has
        ? r.permissions.filter((p) => p !== perm && p !== `${resourceKey}.view` && p !== `${resourceKey}.manage`)
        : [...r.permissions, perm]
      return { ...r, permissions }
    }))
    logAction(has ? 'Revoked permission' : 'Granted permission', `${resourceKey} → ${role.name}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Roles &amp; Permissions</h1>
        <p className="text-sm text-ink-soft">Control what each role can see and manage across the console.</p>
      </div>

      {!canManage && (
        <div className="flex items-center gap-2 rounded-card border border-ink/10 bg-ivory-dim px-4 py-3 text-sm text-ink-soft">
          <Info size={15} /> You have read-only access to this matrix. Only Super Admins can change permissions.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r) => (
          <div key={r.id} className="rounded-card border border-ink/10 bg-ivory p-4">
            <div className="flex items-center justify-between">
              <Badge variant={r.color}>{r.name}</Badge>
              <span className="text-xs text-ink-soft">{r.permissions.includes('*') ? 'All access' : `${r.permissions.length} grants`}</span>
            </div>
            <p className="mt-2 text-xs text-ink-soft">{r.description}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-card border border-ink/10 bg-ivory">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3 font-medium">Module</th>
              {roles.map((r) => <th key={r.id} className="px-4 py-3 text-center font-medium">{r.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_RESOURCES.map((res) => (
              <tr key={res.key} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-2.5 font-medium">{res.label}</td>
                {roles.map((r) => {
                  const granted = roleHasPermission(r, `${res.key}.view`)
                  const isSuper = r.permissions.includes('*')
                  return (
                    <td key={r.id} className="px-4 py-2.5 text-center">
                      <button
                        disabled={!canManage || isSuper}
                        onClick={() => toggle(r, res.key)}
                        className={cn(
                          'mx-auto flex h-6 w-6 items-center justify-center rounded-full border transition-colors',
                          granted ? 'border-oxblood bg-oxblood text-ivory' : 'border-ink/20 text-transparent',
                          (!canManage || isSuper) && 'cursor-default opacity-80',
                        )}
                      >
                        <Check size={13} />
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
