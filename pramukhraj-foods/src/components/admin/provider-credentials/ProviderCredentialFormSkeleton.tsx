import { Skeleton } from '@/components/ui/Skeleton'

interface ProviderCredentialFormSkeletonProps {
  label?: string
}

export function ProviderCredentialFormSkeleton({ label = 'Loading provider credentials' }: ProviderCredentialFormSkeletonProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-label={label} aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-5 rounded-card border border-ink/10 bg-ivory p-5 sm:grid-cols-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}
