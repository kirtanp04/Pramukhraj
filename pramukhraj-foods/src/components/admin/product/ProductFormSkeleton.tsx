import { Skeleton } from '@/components/ui/Skeleton'

export function ProductFormSkeleton() {
  return (
    <div className="mx-auto max-w-5xl" aria-label="Loading product" aria-busy="true">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
      <Skeleton className="mb-6 h-16 w-full rounded-card" />
      <div className="rounded-card border border-ink/10 bg-ivory p-6 md:p-8">
        <div className="space-y-7">
          <section className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-24 sm:col-span-2" />
            </div>
          </section>
          <div className="grid gap-4 md:grid-cols-3">
            <section className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 rounded-card" />
            </section>
            <section className="space-y-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-24 rounded-card" />
            </section>
            <section className="space-y-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-24 rounded-card" />
            </section>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end rounded-card border border-ink/10 bg-ivory p-4">
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
    </div>
  )
}
