import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, LoaderCircle, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EmailTemplatePreviewDialogProps {
  open: boolean
  name: string
  subject: string
  html: string
  isLoading: boolean
  error: string
  onOpenChange: (open: boolean) => void
  onRetry: () => void
}

export function EmailTemplatePreviewDialog({
  open,
  name,
  subject,
  html,
  isLoading,
  error,
  onOpenChange,
  onRetry,
}: EmailTemplatePreviewDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-teal-deep/70 backdrop-blur-sm" />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby="email-template-preview-subject">
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="fixed inset-3 z-[90] flex flex-col overflow-hidden rounded-card bg-ivory shadow-2xl sm:inset-6 lg:inset-x-[8vw] lg:inset-y-8"
              >
                <header className="flex items-start justify-between gap-4 border-b border-ink/10 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <Dialog.Title className="truncate font-display text-lg! text-ink">{name || 'Email Preview'}</Dialog.Title>
                    <Dialog.Description id="email-template-preview-subject" className="mt-0.5 truncate text-xs! text-ink-soft">{subject}</Dialog.Description>
                  </div>
                  <Dialog.Close className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink" aria-label="Close preview">
                    <X size={18} aria-hidden />
                  </Dialog.Close>
                </header>

                <div className="min-h-0 flex-1 bg-white">
                  {isLoading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-ink-soft" role="status">
                      <LoaderCircle size={28} className="animate-spin text-oxblood" aria-hidden />
                      <p className="text-sm!">Loading email preview...</p>
                    </div>
                  ) : error ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700"><AlertCircle size={24} aria-hidden /></span>
                      <p className="mt-4 max-w-md text-sm! text-ink-soft" role="alert">{error}</p>
                      <Button type="button" variant="outline" className="mt-4" onClick={onRetry}><RefreshCw size={15} aria-hidden /> Retry</Button>
                    </div>
                  ) : (
                    <iframe title={`${name} email preview`} sandbox="" srcDoc={html} className="h-full w-full border-0 bg-white" />
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
