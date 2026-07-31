import { MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const addresses = [
  { label: 'Home', name: 'Aarav Sharma', line: 'B-204, Shreeji Heights, SG Highway', city: 'Ahmedabad, Gujarat 380001', phone: '+91 98765 43210', isDefault: true },
  { label: 'Office', name: 'Aarav Sharma', line: '4th Floor, Iscon Elegance, Prahlad Nagar', city: 'Ahmedabad, Gujarat 380015', phone: '+91 98765 43210', isDefault: false },
]

export function AccountAddresses() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl">Saved Addresses</h2>
        <Button size="sm"><Plus size={14} /> Add Address</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <div key={a.label} className="rounded-card border border-ink/10 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-semibold"><MapPin size={14} className="text-oxblood" /> {a.label}</span>
              {a.isDefault && <span className="stamp-badge rounded-full bg-tan px-2 py-0.5 text-[10px]">Default</span>}
            </div>
            <p className="mt-2 text-sm">{a.name}</p>
            <p className="text-sm text-ink-soft">{a.line}</p>
            <p className="text-sm text-ink-soft">{a.city}</p>
            <p className="mt-1 text-xs text-ink-soft">{a.phone}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
