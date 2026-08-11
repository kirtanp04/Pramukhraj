import { useNavigate } from 'react-router-dom'
import { ShieldAlert, Lock, SearchX, ServerCrash, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type ErrorVariant = 401 | 403 | 404 | 500 | 'network'

interface ApiErrorPageProps {
  variant: ErrorVariant
  message?: string
  /** Overrides the default CTA — defaults to "Go Back" */
  action?: { label: string; onClick: () => void }
  className?: string
}

// ─── Config per variant ───────────────────────────────────────────────────────

const CONFIG: Record<
  ErrorVariant,
  { icon: React.ElementType; title: string; description: string; code: string }
> = {
  401: {
    icon: Lock,
    code: '401',
    title: 'Session Expired',
    description: 'Your session is no longer valid. Please sign in again.',
  },
  403: {
    icon: ShieldAlert,
    code: '403',
    title: 'Access Denied',
    description: "You don't have permission to view this resource. Contact a Super Admin.",
  },
  404: {
    icon: SearchX,
    code: '404',
    title: 'Not Found',
    description: 'The page or resource you were looking for does not exist.',
  },
  500: {
    icon: ServerCrash,
    code: '500',
    title: 'Server Error',
    description: 'Something went wrong on our end. Please try again in a moment.',
  },
  network: {
    icon: WifiOff,
    code: '—',
    title: 'No Connection',
    description: 'Unable to reach the server. Check your internet connection and try again.',
  },
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ApiErrorPage({ variant, message, action, className }: ApiErrorPageProps) {
  const navigate = useNavigate()
  const { icon: Icon, title, description, code } = CONFIG[variant]

  const handleDefault = () => {
    if (variant === 401) {
      navigate('/admin/login', { replace: true })
    } else {
      navigate(-1)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-ink/15 px-6 py-20 text-center h-screen',
        className,
      )}
    >
      <span className="font-mono text-6xl font-bold text-ink/10">{code}</span>
      <Icon size={36} className="mt-3 text-oxblood" aria-hidden />
      <h2 className="mt-4 font-display text-xl">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-ink-soft">{message ?? description}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-6"
        onClick={action?.onClick ?? handleDefault}
      >
        {action?.label ?? (variant === 401 ? 'Sign In Again' : 'Go Back')}
      </Button>
    </div>
  )
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const Unauthorized = (props: Omit<ApiErrorPageProps, 'variant'>) => (
  <ApiErrorPage variant={401} {...props} />
)
export const Forbidden = (props: Omit<ApiErrorPageProps, 'variant'>) => (
  <ApiErrorPage variant={403} {...props} />
)
export const NotFoundError = (props: Omit<ApiErrorPageProps, 'variant'>) => (
  <ApiErrorPage variant={404} {...props} />
)
export const ServerError = (props: Omit<ApiErrorPageProps, 'variant'>) => (
  <ApiErrorPage variant={500} {...props} />
)
export const NetworkError = (props: Omit<ApiErrorPageProps, 'variant'>) => (
  <ApiErrorPage variant="network" {...props} />
)