import { Skeleton } from '@/components/ui/Skeleton'

export function FaqFormSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-5" aria-label="Loading FAQ">
      <Skeleton className="h-12 w-72" />
      <div className="rounded-card border border-ink/10 bg-ivory p-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-28 w-full md:col-span-2" />
          <Skeleton className="h-40 w-full md:col-span-2" />
        </div>
      </div>
    </div>
  )
}
