import { Skeleton } from '@/components/ui/Skeleton'
import { useVisibleCustomerProductImage } from '@/hooks/customer-product/useVisibleCustomerProductImage'
import { cn } from '@/lib/utils'

interface LazyProductImageProps {
  productId: string
  src?: string
  alt: string
  className?: string
}

export function LazyProductImage({ productId, src = '', alt, className }: LazyProductImageProps) {
  const {
    containerRef,
    hasLoaded,
    imageUrl,
    isLoading,
    markLoaded,
    markUnavailable,
  } = useVisibleCustomerProductImage(productId, src)

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
          onLoad={markLoaded}
          onError={markUnavailable}
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
