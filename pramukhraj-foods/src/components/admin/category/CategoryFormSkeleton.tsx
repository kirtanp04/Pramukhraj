import { Skeleton } from '@/components/ui/Skeleton'

export function CategoryFormSkeleton() {
  return (
    <div className="mx-auto max-w-5xl" aria-label="Loading category" aria-busy="true">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
      <div className="grid gap-7 rounded-card border border-ink/10 bg-ivory p-6 md:p-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-10" />
          <Skeleton className="h-32" />
          <Skeleton className="h-10" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-52 rounded-card" />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3 rounded-card border border-ink/10 bg-ivory p-4">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>
    </div>
  )
}
