import { ShieldCheck, Smartphone } from 'lucide-react'
export function AccountSecurity() {
  return (
    <div>
      <h2 className="mb-4 font-display text-xl">Security</h2>
      <div className="max-w-lg space-y-4 rounded-card border border-ink/10 p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm"><ShieldCheck size={16} className="text-oxblood" /> Two-Factor Authentication</span>
          <span className="stamp-badge rounded-full bg-tan px-2 py-0.5 text-[10px]">Enabled</span>
        </div>
        <div className="flex items-center justify-between border-t border-ink/10 pt-4">
          <span className="flex items-center gap-2 text-sm"><Smartphone size={16} className="text-oxblood" /> Active Sessions</span>
          <span className="text-xs text-ink-soft">2 devices</span>
        </div>
      </div>
    </div>
  )
}
