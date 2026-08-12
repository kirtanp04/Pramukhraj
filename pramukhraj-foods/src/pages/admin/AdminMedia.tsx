import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const mediaItems = Array.from({ length: 18 }).map((_, i) => ({
  id: `media-${i}`,
  url: `https://picsum.photos/seed/media-${i}/400/400`,
  name: `asset-${1000 + i}.jpg`,
  size: `${(120 + i * 7) % 900}KB`,
}))

export function AdminMedia() {
  const canManage = true

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Media Library</h1>
          <p className="text-sm text-ink-soft">{mediaItems.length} assets</p>
        </div>
        {canManage && <Button><Upload size={15} /> Upload</Button>}
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {mediaItems.map((m) => (
          <div key={m.id} className="group overflow-hidden rounded-lg border border-ink/10">
            <div className="aspect-square overflow-hidden bg-tan">
              <img src={m.url} alt={m.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
            </div>
            <div className="p-2">
              <p className="truncate text-[11px]">{m.name}</p>
              <p className="text-[10px] text-ink-soft">{m.size}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
