import { useEffect, useRef, useState } from 'react'

export function useInViewOnce<T extends Element>(threshold = 0.1) {
  const ref = useRef<T>(null)
  const [hasEnteredView, setHasEnteredView] = useState(false)

  useEffect(() => {
    if (hasEnteredView) return

    const element = ref.current
    if (!element) return

    if (typeof IntersectionObserver === 'undefined') {
      setHasEnteredView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setHasEnteredView(true)
        observer.disconnect()
      },
      { threshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [hasEnteredView, threshold])

  return { ref, hasEnteredView }
}
