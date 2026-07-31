import { useState } from 'react'
import { Plus, Copy, Trash2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAuthStore } from '@/store/authStore'

interface ApiKey { id: string; label: string; key: string; created: string; lastUsed: string }

export function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([
    { id: 'k1', label: 'Storefront (Production)', key: 'pk_live_9f2a...c831', created: '2026-04-12', lastUsed: '2 mins ago' },
    { id: 'k2', label: 'Mobile App', key: 'pk_live_7b0e...9a02', created: '2026-05-30', lastUsed: '1 hr ago' },
    { id: 'k3', label: 'Analytics Integration', key: 'pk_live_3c88...11de', created: '2026-06-18', lastUsed: '3 days ago' },
  ])
  const [deleteTarget, setDeleteTarget] = useState<ApiKey | null>(null)
  const canManage = useAuthStore((s) => s.hasPermission('settings.manage'))
  const logAction = useAuthStore((s) => s.logAction)

  function createKey() {
    const id = `k${Date.now()}`
    setKeys((prev) => [{ id, label: 'New API Key', key: `pk_live_${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`, created: new Date().toISOString().slice(0, 10), lastUsed: 'Never' }, ...prev])
    logAction('Created API key', id)
  }
  function confirmDelete() {
    if (!deleteTarget) return
    setKeys((prev) => prev.filter((k) => k.id !== deleteTarget.id))
    logAction('Revoked API key', deleteTarget.label)
    setDeleteTarget(null)
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">API Keys</h1>
          <p className="text-sm text-ink-soft">Keys used by storefront, mobile and third-party integrations.</p>
        </div>
        {canManage && <Button onClick={createKey}><Plus size={15} /> Generate Key</Button>}
      </div>
      <div className="divide-y divide-ink/10 rounded-card border border-ink/10 bg-ivory">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-oxblood/10 text-oxblood"><KeyRound size={16} /></span>
            <div className="flex-1">
              <p className="text-sm font-medium">{k.label}</p>
              <p className="font-mono text-xs text-ink-soft">{k.key}</p>
            </div>
            <span className="hidden text-xs text-ink-soft sm:block">Last used {k.lastUsed}</span>
            <button className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5" aria-label="Copy key"><Copy size={14} /></button>
            {canManage && <button onClick={() => setDeleteTarget(k)} className="rounded-full p-1.5 text-oxblood hover:bg-oxblood/5" aria-label="Revoke"><Trash2 size={14} /></button>}
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Revoke this API key?"
        description={`Any integration using "${deleteTarget?.label}" will stop working immediately.`}
        onConfirm={confirmDelete}
        confirmLabel="Revoke"
      />
    </div>
  )
}
