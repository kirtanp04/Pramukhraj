import { Truck } from 'lucide-react'

const zones = [
  { zone: 'Gujarat (Local)', method: 'Standard', days: '1-2 days', fee: '₹0 – ₹29' },
  { zone: 'West India', method: 'Standard', days: '2-4 days', fee: '₹39 – ₹49' },
  { zone: 'North & South India', method: 'Standard', days: '3-5 days', fee: '₹49 – ₹69' },
  { zone: 'North-East India', method: 'Standard', days: '5-7 days', fee: '₹79 – ₹99' },
  { zone: 'All India', method: 'Express', days: '1-2 days', fee: '₹79 – ₹129' },
]

export function AdminShipping() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl">Shipping</h1>
        <p className="text-sm text-ink-soft">Zone-based delivery rates and timelines.</p>
      </div>
      <div className="overflow-x-auto rounded-card border border-ink/10 bg-ivory">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Zone</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Delivery Time</th><th className="px-4 py-3">Fee Range</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.zone + z.method} className="border-b border-ink/5 last:border-0">
                <td className="flex items-center gap-2 px-4 py-3"><Truck size={14} className="text-oxblood" /> {z.zone}</td>
                <td className="px-4 py-3">{z.method}</td>
                <td className="px-4 py-3">{z.days}</td>
                <td className="px-4 py-3 font-mono">{z.fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
