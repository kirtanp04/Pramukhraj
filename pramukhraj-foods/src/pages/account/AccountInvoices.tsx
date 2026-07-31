import { FileText, Download } from 'lucide-react'
import { orders } from '@/mock'
import { formatINR } from '@/lib/utils'
export function AccountInvoices() {
  return (
    <div>
      <h2 className="mb-4 font-display text-xl">Invoices</h2>
      <div className="divide-y divide-ink/10 rounded-card border border-ink/10">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between gap-3 p-4">
            <span className="flex items-center gap-2 text-sm"><FileText size={15} className="text-ink-soft" /> Invoice #{o.id}</span>
            <span className="font-mono text-sm">{formatINR(o.total)}</span>
            <button className="flex items-center gap-1 text-sm text-oxblood hover:underline"><Download size={13} /> Download</button>
          </div>
        ))}
      </div>
    </div>
  )
}
