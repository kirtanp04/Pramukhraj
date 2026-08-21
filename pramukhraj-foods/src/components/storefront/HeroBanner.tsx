import { useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { assets } from '@/assets'
import { cn } from '@/lib/utils'

interface BannerSlide {
  src: string
  alt: string
}

const HOME_BANNERS: BannerSlide[] = [
  {
    src: assets.HomeBanner,
    alt: 'Shree Pramukhraj papad, mathiya, cholafali and namkeen product range',
  },
]

interface HeroBannerProps {
  slides?: BannerSlide[]
}

export function HeroBanner({ slides = HOME_BANNERS }: HeroBannerProps) {
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: slides.length > 1,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const hasMultipleSlides = slides.length > 1

  useEffect(() => {
    if (!emblaApi) return

    const updateSelectedIndex = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    updateSelectedIndex()
    emblaApi.on('select', updateSelectedIndex)
    emblaApi.on('reInit', updateSelectedIndex)

    return () => {
      emblaApi.off('select', updateSelectedIndex)
      emblaApi.off('reInit', updateSelectedIndex)
    }
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi || !hasMultipleSlides || isPaused) return

    const autoplayId = window.setInterval(() => emblaApi.scrollNext(), 6500)
    return () => window.clearInterval(autoplayId)
  }, [emblaApi, hasMultipleSlides, isPaused, selectedIndex])

  if (slides.length === 0) return null

  return (
    <div className="relative">
      <section
        aria-label="Featured Pramukhraj products"
        aria-roledescription="carousel"
        className="group relative min-w-0 overflow-hidden bg-teal-deep shadow-[0_24px_60px_-28px_rgba(23,37,84,0.75)] [clip-path:polygon(9%_0,100%_0,100%_100%,0_100%,0_9%)] lg:[clip-path:polygon(11%_0,100%_0,100%_100%,0_100%,0_12%)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 ring-1 ring-inset ring-ivory/10" />

        <div ref={viewportRef} className="overflow-hidden touch-pan-y">
          <div className="flex">
            {slides.map((slide, index) => (
              <div
                key={slide.src}
                aria-label={`${index + 1} of ${slides.length}`}
                aria-roledescription="slide"
                className="h-[clamp(16rem,72vw,31rem)] min-w-0 flex-[0_0_100%] lg:h-[clamp(30rem,42vw,36rem)]"
              >
                <img
                  src={slide.src}
                  alt={slide.alt}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="h-full w-full select-none object-contain object-center"
                />
              </div>
            ))}
          </div>
        </div>

        {hasMultipleSlides && (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous banner"
              className="absolute left-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/25 bg-teal-deep/65 text-ivory opacity-0 backdrop-blur-sm transition hover:bg-teal-deep focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next banner"
              className="absolute right-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/25 bg-teal-deep/65 text-ivory opacity-0 backdrop-blur-sm transition hover:bg-teal-deep focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronRight size={18} />
            </button>

            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full bg-teal-deep/55 px-2.5 py-2 backdrop-blur-sm">
              {slides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(index)}
                  aria-label={`Show banner ${index + 1}`}
                  aria-current={selectedIndex === index}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    selectedIndex === index ? 'w-5 bg-ivory' : 'w-1.5 bg-ivory/45 hover:bg-ivory/75',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <div
        className="absolute z-30 flex h-20 w-20 rotate-[-7deg] flex-col items-center justify-center rounded-full border border-ivory/60 bg-oxblood px-2 text-center text-ivory shadow-xl sm:h-24 sm:w-24 lg:h-28 lg:w-28"
        style={{ right: 'clamp(0.75rem, 2vw, 1.25rem)', bottom: 'clamp(0.75rem, 2vw, 1.25rem)' }}
      >
        <span className="stamp-badge hidden text-[9px] uppercase tracking-[0.16em] text-ivory/75 sm:block">Authentic taste</span>
        <span className="font-display text-base italic leading-none sm:mt-1 sm:text-lg lg:text-xl">Since 1995</span>
        <span className="mt-1 h-px w-7 bg-ivory/40 sm:mt-1.5 sm:w-8" />
        <span className="mt-1 text-[8px] text-ivory/75 sm:mt-1.5 sm:text-[9px]">Made in Gujarat</span>
      </div>
    </div>
  )
}
