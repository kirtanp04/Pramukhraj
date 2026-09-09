import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  getCachedCustomerProductImage,
  loadCustomerProductImage,
} from '@/services/customerProductImageLoader'
import { cn } from '@/lib/utils'

interface LazyProductImageProps {
  productId: string
  src?: string
  alt: string
  className?: string
}

export function LazyProductImage({ productId, src = '', alt, className }: LazyProductImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageUrl, setImageUrl] = useState(
    () => src || getCachedCustomerProductImage(productId),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    setHasLoaded(false)

    if (src) {
      setImageUrl(src)
      return
    }

    const cached = getCachedCustomerProductImage(productId)
    if (cached) {
      setImageUrl(cached)
      return
    }

    const element = containerRef.current
    if (!element) return

    let isMounted = true
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      setIsLoading(true)
      void loadCustomerProductImage(productId)
        .then((url) => {
          if (isMounted) setImageUrl(url)
        })
        .catch(() => undefined)
        .finally(() => {
          if (isMounted) setIsLoading(false)
        })
    }, { threshold: 0.01 })

    observer.observe(element)
    return () => {
      isMounted = false
      observer.disconnect()
    }
  }, [productId, src])

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {(isLoading || (imageUrl && !hasLoaded)) && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          onLoad={() => setHasLoaded(true)}
          onError={() => {
            setImageUrl('')
            setHasLoaded(false)
          }}
          className={cn(
            'h-full w-full object-cover opacity-0 transition-[opacity,transform] duration-500 group-hover:scale-105',
            hasLoaded && 'opacity-100',
            className,
          )}
        />
      ) : !isLoading ? (
        <div
          className="flex h-full w-full items-center justify-center bg-tan font-display text-3xl text-ink-soft/60"
          aria-label={`${alt} image unavailable`}
        >
          {alt.charAt(0).toUpperCase()}
        </div>
      ) : null}
    </div>
  )
}
