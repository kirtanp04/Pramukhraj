import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EntityFormErrorProps {
  title: string
  message: string
  onBack: () => void
  onRetry?: () => void
}

export function EntityFormError({ title, message, onBack, onRetry }: EntityFormErrorProps) {
  return (
    <div className="mx-auto flex min-h-96 max-w-3xl flex-col items-center justify-center rounded-card border border-dashed border-oxblood/25 bg-ivory px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-oxblood/8 text-oxblood">
        <AlertCircle size={24} aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-xl text-ink">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-ink-soft">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={15} aria-hidden /> Back
        </Button>
        {onRetry && (
          <Button type="button" onClick={onRetry}>
            <RefreshCw size={15} aria-hidden /> Retry
          </Button>
        )}
      </div>
    </div>
  )
}
