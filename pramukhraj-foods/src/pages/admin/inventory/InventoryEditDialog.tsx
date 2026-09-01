import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Switch from '@radix-ui/react-switch'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { AlertCircle, LoaderCircle, PackageOpen, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { AdminInventoryItem } from '@/types/inventory'
import {
  inventoryUpdateSchema,
  type InventoryUpdateFormValues,
} from '@/types/inventorySchema'

interface InventoryEditDialogProps {
  item: AdminInventoryItem | null
  open: boolean
  isSaving: boolean
  serverError: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: InventoryUpdateFormValues) => Promise<void>
}

export function InventoryEditDialog({
  item,
  open,
  isSaving,
  serverError,
  onOpenChange,
  onSubmit,
}: InventoryEditDialogProps) {
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<InventoryUpdateFormValues>({
    resolver: zodResolver(inventoryUpdateSchema),
    defaultValues: { stock: 0, isActive: true },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!item || !open) return
    reset({ stock: item.stock, isActive: item.isVariantActive })
  }, [item, open, reset])

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving) return
    onOpenChange(nextOpen)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/45 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-ink/10 bg-ivory shadow-2xl focus:outline-none"
          onEscapeKeyDown={event => isSaving && event.preventDefault()}
          onPointerDownOutside={event => isSaving && event.preventDefault()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxblood/10 text-oxblood">
                <PackageOpen size={19} aria-hidden />
              </span>
              <div className="min-w-0">
                <Dialog.Title className="font-display text-lg">Update Inventory</Dialog.Title>
                <Dialog.Description className="mt-0.5 truncate text-xs text-ink-soft">
                  {item?.name} · {item ? `${item.weight} ${item.weightUnit}` : ''}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              disabled={isSaving}
              aria-label="Close inventory editor"
              className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={18} aria-hidden />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4 px-5 py-5">
              {serverError && (
                <div className="flex items-start gap-2 rounded-lg border border-oxblood/20 bg-oxblood/5 px-3 py-2.5 text-xs text-oxblood" role="alert">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
                  <span>{serverError}</span>
                </div>
              )}

              <label className="block" htmlFor="inventory-stock">
                <span className="mb-1 block text-xs font-medium text-ink-soft">
                  Stock Quantity <span className="text-oxblood" aria-hidden>*</span>
                </span>
                <input
                  id="inventory-stock"
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  disabled={isSaving}
                  autoFocus
                  aria-invalid={!!errors.stock}
                  aria-describedby={errors.stock ? 'inventory-stock-error' : undefined}
                  {...register('stock', { valueAsNumber: true })}
                  className={cn('admin-input', errors.stock && 'border-oxblood focus:border-oxblood')}
                />
                {errors.stock && (
                  <span id="inventory-stock-error" className="mt-1 block text-xs text-oxblood" role="alert">
                    {errors.stock.message}
                  </span>
                )}
              </label>

              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-ink/10 bg-ivory-dim px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Variant Active</p>
                      <p className="text-xs text-ink-soft">Allow this variant to be purchased.</p>
                    </div>
                    <Switch.Root
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSaving}
                      aria-label="Variant active"
                      className={cn(
                        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                        field.value ? 'bg-oxblood' : 'bg-ink/15',
                        isSaving && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <Switch.Thumb
                        className={cn(
                          'block h-4 w-4 rounded-full bg-ivory shadow transition-transform',
                          field.value ? 'translate-x-[18px]' : 'translate-x-0.5',
                        )}
                      />
                    </Switch.Root>
                  </div>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-ink/10 px-5 py-4">
              <Button type="button" variant="outline" disabled={isSaving} onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || !isDirty}>
                {isSaving && <LoaderCircle size={15} className="animate-spin" aria-hidden />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
