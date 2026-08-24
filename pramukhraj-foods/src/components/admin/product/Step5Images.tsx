import { useCallback, useRef, useState } from 'react'
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import {
  Upload, Trash2, Star, GripVertical, AlertCircle,
  ImagePlus, X, Check, ChevronDown, ChevronUp,
} from 'lucide-react'
import type { ProductFormValues, ProductImageValue } from '@/types/productSchema'
import { inputCls } from '@/components/admin/product/FormField'
import { fileToDataUrl, formatBytes } from '@/lib/imageUpload'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_BYTES = 5 * 1024 * 1024  // 5 MB per file
const MAX_FILES = 2

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

interface FileError {
  name: string
  reason: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Step5ImagesProps {
  form: UseFormReturn<ProductFormValues>
}

// ─── Image property panel (collapsible per-image settings) ────────────────────

interface ImagePanelProps {
  index: number
  form: UseFormReturn<ProductFormValues>
  onSetPrimary: (index: number) => void
  onRemove: (index: number) => void
  isDragging: boolean
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
}

function ImageCard({
  index, form, onSetPrimary, onRemove,
  isDragging, onDragStart, onDragOver, onDragEnd,
}: ImagePanelProps) {
  const [expanded, setExpanded] = useState(false)
  const { register, watch } = form
  const img = watch(`images.${index}`)
  const errors = form.formState.errors.images?.[index]

  if (!img) return null

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={cn(
        'rounded-card border bg-ivory transition-all',
        img.isPrimary ? 'border-turmeric/60 shadow-sm' : 'border-ink/10',
        isDragging && 'opacity-40 shadow-xl scale-[0.98]',
      )}
    >
      {/* ── Card header ── */}
      <div className="flex items-center gap-3 p-3">
        {/* Drag handle */}
        <GripVertical
          size={16}
          className="shrink-0 cursor-grab text-ink-soft/30 active:cursor-grabbing"
          aria-label="Drag to reorder"
        />

        {/* Thumbnail */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-ivory-dim">
          <img
            src={img.imageUrl}
            alt={img.altText ?? ''}
            className="h-full w-full object-cover"
          />
          {img.isPrimary && (
            <span className="absolute bottom-0 left-0 right-0 bg-turmeric/90 py-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-teal-deep">
              Primary
            </span>
          )}
        </div>

        {/* File info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">
            {img.fileName ?? `Image ${index + 1}`}
          </p>
          <p className="text-[11px] text-ink-soft">
            {img.fileSize ? formatBytes(img.fileSize) : '—'}
            {img.mimeType ? ` · ${img.mimeType.replace('image/', '').toUpperCase()}` : ''}
          </p>
          {errors?.imageUrl && (
            <p className="mt-0.5 text-[11px] text-oxblood">{errors.imageUrl.message}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Set primary */}
          <button
            type="button"
            onClick={() => onSetPrimary(index)}
            title={img.isPrimary ? 'Primary image' : 'Set as primary'}
            className={cn(
              'rounded-full p-1.5 transition-colors',
              img.isPrimary
                ? 'text-turmeric'
                : 'text-ink-soft/40 hover:text-turmeric',
            )}
          >
            <Star size={15} fill={img.isPrimary ? 'currentColor' : 'none'} />
          </button>

          {/* Expand properties */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title="Edit image properties"
            className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {/* Remove */}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="rounded-full p-1.5 text-ink-soft hover:bg-oxblood/10 hover:text-oxblood"
            aria-label="Remove image"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Expandable properties panel ── */}
      {expanded && (
        <div className="border-t border-ink/8 bg-ivory-dim px-4 pb-4 pt-3">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
            Image Properties
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Alt text */}
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-ink-soft">
                Alt Text
                <span className="ml-1 text-ink-soft/60">(recommended for accessibility & SEO)</span>
              </span>
              <input
                {...register(`images.${index}.altText`)}
                placeholder="e.g. Front view of 200g Masala Papad pack"
                className={inputCls(!!errors?.altText)}
              />
            </label>

            {/* Display order */}
            <label className="block">
              <span className="mb-1 block text-xs text-ink-soft">Display Order</span>
              <input
                type="number"
                min={0}
                {...register(`images.${index}.displayOrder`, { valueAsNumber: true })}
                className={inputCls()}
              />
              <p className="mt-0.5 text-[11px] text-ink-soft">
                Lower number = shown first. Drag to reorder automatically updates this.
              </p>
            </label>

            {/* Primary toggle */}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={img.isPrimary}
                onChange={() => onSetPrimary(index)}
                className="accent-turmeric"
              />
              <span className="text-xs text-ink-soft">Set as primary image</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Step5Images({ form }: Step5ImagesProps) {
  const { control, setValue, watch, formState: { errors } } = form
  const { fields, append, remove, move } = useFieldArray({ control, name: 'images' })

  const [isDragOver, setIsDragOver] = useState(false)
  const [fileErrors, setFileErrors] = useState<FileError[]>([])
  const [converting, setConverting] = useState(false)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const images = watch('images')

  // ── Primary management ──────────────────────────────────────────────────────

  function setPrimary(index: number) {
    images.forEach((_, i) => setValue(`images.${i}.isPrimary`, i === index))
  }

  // ── Row drag-to-reorder ─────────────────────────────────────────────────────

  function handleRowDragStart(index: number) {
    setDraggingIndex(index)
  }

  function handleRowDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggingIndex !== null && draggingIndex !== index) {
      move(draggingIndex, index)
      setDraggingIndex(index)
    }
  }

  function handleRowDragEnd() {
    // Sync displayOrder after reorder
    images.forEach((_, i) => setValue(`images.${i}.displayOrder`, i))
    setDraggingIndex(null)
  }

  // ── File remove ─────────────────────────────────────────────────────────────

  function handleRemove(index: number) {
    const wasPrimary = images[index]?.isPrimary
    remove(index)
    if (wasPrimary && fields.length > 1) {
      // Give primary to the first remaining image
      const nextIndex = index === 0 ? 0 : index - 1
      setTimeout(() => setValue(`images.${nextIndex}.isPrimary`, true), 0)
    }
  }

  // ── File processing — validate → FileReader → base64 → append ───────────────

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const remaining = MAX_FILES - fields.length
    if (remaining <= 0) {
      setFileErrors([{ name: 'Upload limit', reason: `Maximum ${MAX_FILES} images allowed.` }])
      return
    }

    const toProcess = fileArray.slice(0, remaining)
    const skipped = fileArray.slice(remaining)
    const errs: FileError[] = skipped.map((f) => ({
      name: f.name,
      reason: `Skipped — maximum ${MAX_FILES} images reached.`,
    }))

    setConverting(true)

    for (const file of toProcess) {
      // Type check
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errs.push({ name: file.name, reason: `Unsupported type (${file.type}). Use JPEG, PNG, WebP or GIF.` })
        continue
      }
      // Size check
      if (file.size > MAX_SIZE_BYTES) {
        errs.push({ name: file.name, reason: `File too large (${formatBytes(file.size)}). Max is ${formatBytes(MAX_SIZE_BYTES)}.` })
        continue
      }

      try {
        const base64 = await fileToDataUrl(file)
        const isFirst = fields.length === 0 && toProcess.indexOf(file) === 0

        const entry: ProductImageValue = {
          id: generateId(),
          imageUrl: base64,
          altText: null,
          isPrimary: isFirst,
          displayOrder: fields.length + toProcess.indexOf(file),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }
        append(entry)
      } catch {
        errs.push({ name: file.name, reason: 'Failed to read file. Please try again.' })
      }
    }

    setFileErrors(errs)
    setConverting(false)
  }, [fields.length, append])

  // ── Drop zone handlers ──────────────────────────────────────────────────────

  function handleDropZoneDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDropZoneDragLeave(e: React.DragEvent) {
    // Only clear if truly leaving the drop zone (not a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      // Reset so same file can be picked again
      e.target.value = ''
    }
  }

  const topLevelError = (errors.images as { message?: string } | undefined)?.message
  const primaryIndex = images.findIndex((img) => img.isPrimary)

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <h3 className="font-display text-base font-semibold text-ink">Images</h3>
        <p className="text-xs text-ink-soft">
          Upload product images from your device. The{' '}
          <Star size={11} className="inline text-turmeric" /> starred image is the primary
          photo shown in listings. Drag cards to reorder. Max {MAX_FILES} images · 5 MB each.
        </p>
      </div>

      {/* ── Validation error banner ── */}
      {topLevelError && (
        <div className="flex items-center gap-2 rounded-lg border border-oxblood/30 bg-oxblood/5 px-3 py-2.5 text-xs text-oxblood">
          <AlertCircle size={14} className="shrink-0" /> {topLevelError}
        </div>
      )}

      {/* ── Drop zone ── */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload images drop zone"
        onDragOver={handleDropZoneDragOver}
        onDragLeave={handleDropZoneDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        className={cn(
          'relative flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3',
          'rounded-card border-2 border-dashed transition-all select-none',
          isDragOver
            ? 'border-oxblood bg-oxblood/5 scale-[1.01]'
            : 'border-ink/20 bg-ivory-dim hover:border-oxblood/40 hover:bg-ivory',
          converting && 'pointer-events-none opacity-70',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          className="sr-only"
          onChange={handleFileInput}
          aria-label="Select images"
        />

        {converting ? (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/10 border-t-oxblood" />
            <p className="text-sm text-ink-soft">Converting images…</p>
          </>
        ) : (
          <>
            <span className={cn('flex h-12 w-12 items-center justify-center rounded-full', isDragOver ? 'bg-oxblood/10' : 'bg-ink/5')}>
              {isDragOver ? (
                <ImagePlus size={22} className="text-oxblood" />
              ) : (
                <Upload size={22} className="text-ink-soft" />
              )}
            </span>
            <div className="text-center">
              <p className="text-sm font-medium text-ink">
                {isDragOver ? 'Drop images here' : 'Drag & drop images here'}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                or <span className="font-medium text-oxblood underline underline-offset-2">browse from device</span>
              </p>
              <p className="mt-1 text-[11px] text-ink-soft/70">
                JPEG · PNG · WebP · GIF — max 5 MB per file
              </p>
            </div>
            {fields.length > 0 && (
              <span className="rounded-full bg-teal/10 px-3 py-0.5 text-xs text-teal">
                {fields.length} / {MAX_FILES} images added
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Per-file errors ── */}
      {fileErrors.length > 0 && (
        <div className="rounded-lg border border-oxblood/20 bg-oxblood/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-oxblood">
              {fileErrors.length} file{fileErrors.length !== 1 ? 's' : ''} could not be added
            </p>
            <button
              type="button"
              onClick={() => setFileErrors([])}
              className="rounded-full p-0.5 text-oxblood/60 hover:text-oxblood"
              aria-label="Dismiss errors"
            >
              <X size={14} />
            </button>
          </div>
          <ul className="space-y-1">
            {fileErrors.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-oxblood">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span><strong>{e.name}</strong> — {e.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── No images placeholder ── */}
      {fields.length === 0 && !converting && (
        <p className="text-center text-xs text-ink-soft">
          No images yet — drag files onto the zone above or click Browse.
        </p>
      )}

      {/* ── Image cards ── */}
      {fields.length > 0 && (
        <div className="space-y-2">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-ink-soft">
              {fields.length} image{fields.length !== 1 ? 's' : ''} ·
              click <ChevronDown size={11} className="inline" /> on a card to edit its properties
            </p>
            {primaryIndex === -1 && (
              <p className="flex items-center gap-1 text-[11px] text-oxblood">
                <AlertCircle size={11} /> No primary selected
              </p>
            )}
          </div>

          {/* Cards */}
          {fields.map((field, index) => (
            <ImageCard
              key={field.id}
              index={index}
              form={form}
              onSetPrimary={setPrimary}
              onRemove={handleRemove}
              isDragging={draggingIndex === index}
              onDragStart={handleRowDragStart}
              onDragOver={handleRowDragOver}
              onDragEnd={handleRowDragEnd}
            />
          ))}

          {/* Primary confirmation */}
          {primaryIndex !== -1 && (
            <p className="flex items-center gap-1.5 text-[11px] text-teal">
              <Check size={12} />
              Image {primaryIndex + 1} ({images[primaryIndex]?.fileName ?? 'Unknown'}) is set as primary
            </p>
          )}
        </div>
      )}
    </div>
  )
}
