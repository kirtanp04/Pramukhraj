import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getCachedCustomerProductImage,
  loadCustomerProductImage,
} from '@/services/customerProductImageLoader'

export function useVisibleCustomerProductImage(productId: string, sourceUrl = '') {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageUrl, setImageUrl] = useState(
    () => sourceUrl || getCachedCustomerProductImage(productId),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (sourceUrl) {
      setImageUrl(sourceUrl)
      setIsLoading(false)
      return
    }

    const cachedUrl = getCachedCustomerProductImage(productId)
    if (cachedUrl) {
      setImageUrl(cachedUrl)
      setIsLoading(false)
      return
    }

    setImageUrl('')
    const element = containerRef.current
    if (!element) return

    let isMounted = true
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return

      observer.disconnect()
      setIsLoading(true)
      void loadCustomerProductImage(productId)
        .then((url) => {
          if (isMounted) setImageUrl(url)
        })
        .catch(() => {
          if (isMounted) setImageUrl('')
        })
        .finally(() => {
          if (isMounted) setIsLoading(false)
        })
    }, { threshold: 0.01 })

    observer.observe(element)
    return () => {
      isMounted = false
      observer.disconnect()
    }
  }, [productId, sourceUrl])

  const markLoaded = useCallback(() => {
    setLoadedImageUrl(imageUrl)
  }, [imageUrl])
  const markUnavailable = useCallback(() => {
    setImageUrl('')
    setLoadedImageUrl(null)
  }, [])

  const hasLoaded = imageUrl !== '' && loadedImageUrl === imageUrl

  return {
    containerRef,
    hasLoaded,
    imageUrl,
    isLoading,
    markLoaded,
    markUnavailable,
  }
}
