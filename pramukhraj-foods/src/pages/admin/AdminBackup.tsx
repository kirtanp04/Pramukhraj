import { Download, DatabaseBackup, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

const backups = [
  { id: 'bk-1', date: '2026-07-29 03:00', size: '482 MB', type: 'Automatic' },
  { id: 'bk-2', date: '2026-07-28 03:00', size: '480 MB', type: 'Automatic' },
  { id: 'bk-3', date: '2026-07-27 03:00', size: '479 MB', type: 'Automatic' },
  { id: 'bk-4', date: '2026-07-25 14:22', size: '478 MB', type: 'Manual' },
]

export function AdminBackup() {
  const canManage = useAuthStore((s) => s.hasPermission('settings.manage'))
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Backups</h1>
          <p className="text-sm text-ink-soft">Daily automatic backups, retained for 30 days.</p>
        </div>
        {canManage && <Button><DatabaseBackup size={15} /> Backup Now</Button>}
      </div>
      <div className="divide-y divide-ink/10 rounded-card border border-ink/10 bg-ivory">
        {backups.map((b) => (
          <div key={b.id} className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/10 text-teal"><DatabaseBackup size={16} /></span>
            <div className="flex-1">
              <p className="text-sm font-medium">{b.date}</p>
              <p className="text-xs text-ink-soft">{b.type} · {b.size}</p>
            </div>
            {canManage && (
              <>
                <button className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5" aria-label="Download"><Download size={14} /></button>
                <button className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5" aria-label="Restore"><RotateCw size={14} /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
