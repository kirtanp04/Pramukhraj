import { Server, Database, Cpu, Gauge, CheckCircle2 } from 'lucide-react'

const services = [
  { name: 'API Gateway', status: 'Operational', uptime: '99.98%', icon: Server },
  { name: 'Database Cluster', status: 'Operational', uptime: '99.95%', icon: Database },
  { name: 'Background Jobs', status: 'Operational', uptime: '99.90%', icon: Cpu },
  { name: 'CDN & Media', status: 'Operational', uptime: '100.00%', icon: Gauge },
]

export function AdminSystemHealth() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">System Health</h1>
        <p className="text-sm text-ink-soft">Live status of core platform services (simulated).</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <div key={s.name} className="rounded-card border border-ink/10 bg-ivory p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/10 text-teal"><s.icon size={16} /></span>
              <span className="flex items-center gap-1 text-xs font-medium text-green-700"><CheckCircle2 size={13} /> {s.status}</span>
            </div>
            <p className="mt-4 font-display text-2xl">{s.uptime}</p>
            <p className="text-xs text-ink-soft">{s.name} · 30-day uptime</p>
          </div>
        ))}
      </div>
    </div>
  )
}
