import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ConfirmDialog({
  open, onOpenChange, title, description, onConfirm, confirmLabel = 'Delete',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  confirmLabel?: string
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[80] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-card bg-ivory p-6 shadow-2xl">
          <div className="flex items-center gap-2 text-oxblood">
            <AlertTriangle size={20} />
            <Dialog.Title className="font-display text-lg text-ink">{title}</Dialog.Title>
          </div>
          <Dialog.Description className="mt-2 text-sm text-ink-soft">{description}</Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild><Button variant="outline">Cancel</Button></Dialog.Close>
            <Button variant="primary" className="bg-oxblood" onClick={() => { onConfirm(); onOpenChange(false) }}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
