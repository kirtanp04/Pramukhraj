import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface AsyncEntityThumbnailProps {
  imageUrl?: string
  alt: string
  loading: boolean
  className?: string
}

export function AsyncEntityThumbnail({
  imageUrl,
  alt,
  loading,
  className,
}: AsyncEntityThumbnailProps) {
  const [failed, setFailed] = useState(false)
  const sizeClassName = cn('h-10 w-10 shrink-0 rounded-lg', className)

  if (loading) return <Skeleton className={sizeClassName} />

  if (!imageUrl || failed) {
    return (
      <span
        className={cn(
          'flex items-center justify-center bg-oxblood/10 font-medium text-oxblood',
          sizeClassName,
        )}
        title="Image unavailable"
      >
        {alt.trim().charAt(0).toUpperCase() || <ImageOff size={14} aria-hidden />}
      </span>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover', sizeClassName)}
    />
  )
}
