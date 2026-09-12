import { useRef, useState, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import { assets } from '@/assets'
import { Button } from '@/components/ui/Button'
import { fileToDataUrl } from '@/lib/imageUpload'
import { cn } from '@/lib/utils'

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_IMAGE_SIZE = 4 * 1024 * 1024

interface HomepageHeroImageUploaderProps {
  value: string
  altText: string
  error?: string
  disabled?: boolean
  onChange: (value: string) => void
}

export function HomepageHeroImageUploader({
  value,
  altText,
  error,
  disabled = false,
  onChange,
}: HomepageHeroImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [fileError, setFileError] = useState('')
  const [isReading, setIsReading] = useState(false)

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setFileError('Please select a PNG, JPG, JPEG or WebP image.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFileError('The image must be 4 MB or smaller.')
      return
    }

    setFileError('')
    setIsReading(true)
    try {
      onChange(await fileToDataUrl(file))
      setSelectedFileName(file.name)
    } catch {
      setFileError('The image could not be read. Please try another file.')
    } finally {
      setIsReading(false)
    }
  }

  const displayedError = fileError || error

  return (
    <div>
      <span className="mb-1 block text-xs text-ink-soft">Hero Image</span>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        disabled={disabled || isReading}
        onChange={handleImageChange}
        className="sr-only"
        aria-label="Upload hero image"
      />
      <div className={cn(
        'flex flex-col gap-4 rounded-lg border border-dashed bg-ivory-dim p-4 sm:flex-row sm:items-center',
        displayedError ? 'border-oxblood/50' : 'border-ink/15',
      )}>
        <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-teal-deep sm:w-36">
          <img src={value || assets.HomeBanner} alt={altText} className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {selectedFileName ?? (value ? 'Saved homepage banner' : 'Default homepage banner')}
          </p>
          <p className="mt-1 text-xs text-ink-soft">PNG, JPG, JPEG or WebP · maximum 4 MB</p>
          {displayedError && <p className="mt-1 text-xs text-oxblood" role="alert">{displayedError}</p>}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            disabled={disabled || isReading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={14} /> {isReading ? 'Loading…' : value ? 'Replace Image' : 'Choose Image'}
          </Button>
        </div>
      </div>
    </div>
  )
}
