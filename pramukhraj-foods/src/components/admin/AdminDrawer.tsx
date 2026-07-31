import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function AdminDrawer({
  open, onOpenChange, title, description, children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-ink/40" />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={description ? undefined : undefined}>
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-xl flex-col bg-ivory shadow-2xl"
              >
                <div className="flex items-start justify-between border-b border-ink/10 px-6 py-4">
                  <div>
                    <Dialog.Title className="font-display text-lg">{title}</Dialog.Title>
                    {description && <Dialog.Description className="mt-0.5 text-sm text-ink-soft">{description}</Dialog.Description>}
                  </div>
                  <Dialog.Close aria-label="Close"><X size={20} /></Dialog.Close>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
