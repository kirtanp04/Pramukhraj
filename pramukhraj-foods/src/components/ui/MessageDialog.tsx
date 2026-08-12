import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageDialogVariant = 'success' | 'error'

export interface MessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant: MessageDialogVariant
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

// ─── Per-variant config ───────────────────────────────────────────────────────

const CONFIG = {
  success: {
    icon: CheckCircle2,
    defaultTitle: 'Success',
    iconClass: 'text-green-600',
    iconBgClass: 'bg-green-50',
    accentClass: 'border-green-200',
    buttonClass: 'bg-teal text-ivory hover:bg-teal-light',
  },
  error: {
    icon: XCircle,
    defaultTitle: 'Something went wrong',
    iconClass: 'text-oxblood',
    iconBgClass: 'bg-oxblood/8',
    accentClass: 'border-oxblood/20',
    buttonClass: 'bg-oxblood text-ivory hover:bg-oxblood-deep',
  },
} as const

// ─── Component ────────────────────────────────────────────────────────────────

export function MessageDialog({
  open,
  onOpenChange,
  variant,
  title,
  message,
  actionLabel = 'Got it',
  onAction,
}: MessageDialogProps) {
  const { icon: Icon, defaultTitle, iconClass, iconBgClass, accentClass, buttonClass } =
    CONFIG[variant]

  const displayTitle = title ?? defaultTitle

  function handleAction() {
    if (onAction) {
      onAction()
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[90] bg-ink/40 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            {/* Panel */}
            <Dialog.Content asChild aria-describedby="msg-dialog-desc">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 10 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                className={cn(
                  'fixed left-1/2 top-1/2 z-[90] w-full max-w-sm -translate-x-1/2 -translate-y-1/2',
                  'rounded-card border bg-ivory shadow-2xl',
                  accentClass,
                )}
              >
                {/* Close button */}
                <Dialog.Close
                  aria-label="Close"
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5"
                >
                  <X size={16} />
                </Dialog.Close>

                <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
                  {/* Icon */}
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.06 }}
                    className={cn(
                      'mb-4 flex h-14 w-14 items-center justify-center rounded-full',
                      iconBgClass,
                    )}
                  >
                    <Icon size={28} className={iconClass} aria-hidden />
                  </motion.span>

                  {/* Title */}
                  <Dialog.Title className="font-display text-xl text-ink">
                    {displayTitle}
                  </Dialog.Title>

                  {/* Message */}
                  <Dialog.Description
                    id="msg-dialog-desc"
                    className="mt-2 text-sm leading-relaxed text-ink-soft"
                  >
                    {message}
                  </Dialog.Description>

                  {/* Action button */}
                  <button
                    type="button"
                    onClick={handleAction}
                    className={cn(
                      'mt-6 w-full rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
                      buttonClass,
                    )}
                  >
                    {actionLabel}
                  </button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export type SuccessDialogProps = Omit<MessageDialogProps, 'variant'>
export type ErrorDialogProps = Omit<MessageDialogProps, 'variant'>

export const SuccessDialog = (props: SuccessDialogProps) => (
  <MessageDialog variant="success" {...props} />
)

export const ErrorDialog = (props: ErrorDialogProps) => (
  <MessageDialog variant="error" {...props} />
)