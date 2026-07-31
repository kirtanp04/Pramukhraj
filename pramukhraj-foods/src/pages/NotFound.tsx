import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="scallop-bottom scallop-top mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-tan font-display text-3xl">404</div>
      <h1 className="font-display text-2xl">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">The page you're looking for doesn't exist or may have been moved.</p>
      <Button className="mt-6" asChild><Link to="/">Back to Home</Link></Button>
    </div>
  )
}
