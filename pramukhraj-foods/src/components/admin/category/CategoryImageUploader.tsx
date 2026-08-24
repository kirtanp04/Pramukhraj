import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react'
import { AlertCircle, ImagePlus, LoaderCircle, Trash2, Upload } from 'lucide-react'
import {
  PRODUCT_CATEGORY_IMAGE_MAX_BYTES,
  PRODUCT_CATEGORY_IMAGE_TYPES,
  productCategoryImageFileSchema,
} from '@/types/productCategorySchema'
import { fileToDataUrl, formatBytes } from '@/lib/imageUpload'
import { cn } from '@/lib/utils'

interface CategoryImageUploaderProps {
  value: string
  error?: string
  disabled?: boolean
  onChange: (imageUrl: string) => void
  onError: (message?: string) => void
}

export function CategoryImageUploader({
  value,
  error,
  disabled = false,
  onChange,
  onError,
}: CategoryImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const interactionDisabled = disabled || isProcessing

  async function processFile(file: File) {
    const validation = productCategoryImageFileSchema.safeParse(file)
    if (!validation.success) {
      onError(validation.error.issues[0]?.message ?? 'Invalid category image.')
      return
    }

    setIsProcessing(true)
    onError(undefined)

    try {
      const imageUrl = await fileToDataUrl(file)
      if (!mountedRef.current) return
      setFileName(file.name)
      onChange(imageUrl)
    } catch {
      if (mountedRef.current) onError('The image could not be read. Please try again.')
    } finally {
      if (mountedRef.current) setIsProcessing(false)
    }
  }

  function selectFirstFile(files: FileList | null) {
    if (files && files.length > 1) {
      onError('Only one category image is allowed.')
      return
    }
    const file = files?.item(0)
    if (file) void processFile(file)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    selectFirstFile(event.target.files)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragOver(false)
    if (!interactionDisabled) selectFirstFile(event.dataTransfer.files)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!interactionDisabled && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  function removeImage() {
    setFileName('')
    onChange('')
    onError('Category image is required.')
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={interactionDisabled ? -1 : 0}
        aria-label={value ? 'Replace category image' : 'Upload category image'}
        aria-disabled={interactionDisabled}
        onClick={() => !interactionDisabled && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault()
          if (!interactionDisabled) setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex min-h-52 items-center justify-center overflow-hidden rounded-card border-2 border-dashed bg-ivory-dim transition-all',
          interactionDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          isDragOver ? 'border-oxblood bg-oxblood/5' : 'border-ink/20 hover:border-oxblood/40',
          error && 'border-oxblood/50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={PRODUCT_CATEGORY_IMAGE_TYPES.join(',')}
          disabled={interactionDisabled}
          onChange={handleInputChange}
          className="sr-only"
          aria-label="Choose category image"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-2 text-ink-soft" aria-live="polite">
            <LoaderCircle size={28} className="animate-spin text-oxblood" aria-hidden />
            <span className="text-sm">Processing image...</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="Category preview" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-ink/35 opacity-0 transition-opacity hover:opacity-100" />
            <span className="relative rounded-full bg-ivory/95 px-4 py-2 text-xs font-medium text-ink shadow">
              Click or drop to replace
            </span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 px-5 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5">
              {isDragOver ? <ImagePlus size={22} className="text-oxblood" /> : <Upload size={22} className="text-ink-soft" />}
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Drag and drop one image here</p>
              <p className="mt-1 text-xs text-ink-soft">or click to browse</p>
              <p className="mt-1 text-[11px] text-ink-soft/70">
                JPG, PNG or WEBP · max {formatBytes(PRODUCT_CATEGORY_IMAGE_MAX_BYTES)}
              </p>
            </div>
          </div>
        )}
      </div>

      {value && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 px-3 py-2">
          <p className="min-w-0 truncate text-xs text-ink-soft">{fileName || 'Category image'}</p>
          <button
            type="button"
            disabled={interactionDisabled}
            onClick={removeImage}
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-oxblood disabled:opacity-50"
          >
            <Trash2 size={13} aria-hidden /> Remove
          </button>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-oxblood" role="alert">
          <AlertCircle size={12} aria-hidden /> {error}
        </p>
      )}
    </div>
  )
}
