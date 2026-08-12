import { useState } from 'react'
import * as Switch from '@radix-ui/react-switch'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const initialSections = [
  { key: 'hero', label: 'Hero Banner', enabled: true },
  { key: 'categories', label: 'Shop by Category', enabled: true },
  { key: 'deals', label: "Today's Deals", enabled: true },
  { key: 'trending', label: 'Trending Now', enabled: true },
  { key: 'bestsellers', label: 'Best Sellers', enabled: true },
  { key: 'newarrivals', label: 'New Arrivals', enabled: true },
  { key: 'testimonials', label: 'Customer Testimonials', enabled: true },
  { key: 'blog', label: 'Stories & Recipes', enabled: true },
  { key: 'faq', label: 'FAQ', enabled: true },
]

export function AdminCMS() {
  const canManage = true
  const logAction = useAuthStore((s) => s.logAction)
  const [headline, setHeadline] = useState('Traditional taste, modern shopping.')
  const [subtext, setSubtext] = useState('Hand-rolled papad, stone-ground masala and small-batch sweets — sourced from home kitchens across Gujarat and shipped to your door.')
  const [badge, setBadge] = useState('Est. 2026 · Ahmedabad, Gujarat')
  const [sections, setSections] = useState(initialSections)
  const [saved, setSaved] = useState(false)

  function toggleSection(key: string) {
    setSections((prev) => prev.map((s) => s.key === key ? { ...s, enabled: !s.enabled } : s))
  }

  function save() {
    logAction('Published homepage content', headline)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Homepage CMS</h1>
          <p className="text-sm text-ink-soft">Edit the hero content and toggle homepage sections.</p>
        </div>
        {canManage && (
          <Button onClick={save}>
            <Save size={15} /> {saved ? 'Published!' : 'Publish Changes'}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4 rounded-card border border-ink/10 bg-ivory p-5">
          <h2 className="font-display text-lg">Hero Section</h2>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Eyebrow Badge</span>
            <input value={badge} onChange={(e) => setBadge(e.target.value)} disabled={!canManage} className="admin-input disabled:opacity-60" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Headline</span>
            <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} disabled={!canManage} rows={2} className="admin-input resize-none disabled:opacity-60" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ink-soft">Subtext</span>
            <textarea value={subtext} onChange={(e) => setSubtext(e.target.value)} disabled={!canManage} rows={3} className="admin-input resize-none disabled:opacity-60" />
          </label>

          <div className="rounded-lg border border-dashed border-ink/15 bg-ivory-dim p-4">
            <p className="mb-2 text-[10px] uppercase tracking-wide text-ink-soft">Live Preview</p>
            <span className="stamp-badge mb-2 inline-block rounded-full bg-oxblood/10 px-2.5 py-1 text-[10px] text-oxblood">{badge}</span>
            <p className="font-display text-xl leading-snug">{headline}</p>
            <p className="mt-1 text-xs text-ink-soft">{subtext}</p>
          </div>
        </div>

        <div className="rounded-card border border-ink/10 bg-ivory p-5">
          <h2 className="mb-4 font-display text-lg">Section Visibility</h2>
          <div className="divide-y divide-ink/10">
            {sections.map((s) => (
              <div key={s.key} className="flex items-center justify-between py-3">
                <span className="text-sm">{s.label}</span>
                <Switch.Root
                  checked={s.enabled}
                  onCheckedChange={() => canManage && toggleSection(s.key)}
                  disabled={!canManage}
                  className={cn('relative h-5 w-9 rounded-full transition-colors', s.enabled ? 'bg-oxblood' : 'bg-ink/15')}
                >
                  <Switch.Thumb className={cn('block h-4 w-4 translate-x-0.5 rounded-full bg-ivory transition-transform', s.enabled && 'translate-x-[18px]')} />
                </Switch.Root>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
