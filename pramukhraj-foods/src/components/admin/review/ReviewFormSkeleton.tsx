import { Skeleton } from '@/components/ui/Skeleton'

export function ReviewFormSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-5" aria-label="Loading review">
      <Skeleton className="h-12 w-72" />
      <div className="rounded-card border border-ink/10 bg-ivory p-8">
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}
        </div>
      </div>
    </div>
  )
}
