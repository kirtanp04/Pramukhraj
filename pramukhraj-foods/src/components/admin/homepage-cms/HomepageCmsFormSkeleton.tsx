import { Skeleton } from '@/components/ui/Skeleton'

export function HomepageCmsFormSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading homepage CMS">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-10 w-52" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5 rounded-card border border-ink/10 bg-ivory p-5">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-[34rem] w-full rounded-card" />
      </div>
    </div>
  )
}
