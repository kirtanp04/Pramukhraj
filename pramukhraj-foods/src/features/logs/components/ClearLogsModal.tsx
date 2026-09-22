import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ClearLogsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetDate: string
  fileName?: string
  formattedSize?: string
  isClearing: boolean
  onConfirm: () => void
}

export function ClearLogsModal({
  open,
  onOpenChange,
  targetDate,
  fileName,
  formattedSize,
  isClearing,
  onConfirm,
}: ClearLogsModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-ink/10 bg-ivory p-6 shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-oxblood/10 text-oxblood">
                      <AlertTriangle size={20} />
                    </span>
                    <div>
                      <Dialog.Title className="font-display text-lg text-ink">
                        Clear System Logs
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-ink-soft">
                        Date: {targetDate}
                      </Dialog.Description>
                    </div>
                  </div>

                  <Dialog.Close asChild>
                    <button
                      type="button"
                      disabled={isClearing}
                      className="rounded-full p-1 text-ink-soft hover:bg-ink/5 hover:text-ink transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="mt-4 rounded-xl border border-oxblood/20 bg-oxblood/[0.04] p-3 text-xs leading-relaxed text-oxblood">
                  <p className="font-semibold">Caution: Truncation is permanent</p>
                  <p className="mt-1 text-[11px] text-ink/80">
                    This will truncate the server log file on disk and reclaim storage. All existing
                    log entries for this date will be deleted. Active logging will continue normally.
                  </p>
                </div>

                {fileName && (
                  <div className="mt-4 space-y-1 rounded-lg border border-ink/10 bg-ink/[0.02] p-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Target File:</span>
                      <span className="font-mono font-medium text-ink">{fileName}</span>
                    </div>
                    {formattedSize && (
                      <div className="flex justify-between">
                        <span className="text-ink-soft">Current Size:</span>
                        <span className="font-mono font-medium text-ink">{formattedSize}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isClearing}
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={isClearing}
                    onClick={onConfirm}
                    className="bg-red-600 hover:bg-red-700 text-ivory inline-flex items-center gap-1.5"
                  >
                    <Trash2 size={15} />
                    {isClearing ? 'Clearing...' : 'Clear Logs Now'}
                  </Button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
