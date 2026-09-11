import { Rating } from '@/components/ui/Rating'
import { Skeleton } from '@/components/ui/Skeleton'
import { useInViewOnce } from '@/hooks/useInViewOnce'
import { useTopTestimonials } from '@/hooks/useTopTestimonials'

export function Testimonials() {
  const { ref, hasEnteredView } = useInViewOnce<HTMLElement>()
  const { testimonials, isLoading, hasLoaded, error, retry } = useTopTestimonials(hasEnteredView)

  if (hasLoaded && testimonials.length === 0) return null

  return (
    <section ref={ref} className="min-h-80 bg-teal py-14 text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <p className="mb-1 text-center text-xs font-medium uppercase tracking-wider text-amber-300">What customers say</p>
        <h2 className="mb-10 text-center font-display text-3xl">Loved across India</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {isLoading && Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-44 rounded-card bg-white/15" />
          ))}

          {!isLoading && testimonials.map((testimonial, index) => (
            <article key={`${testimonial.customerName}-${index}`} className="rounded-card border border-white/20 bg-white/10 p-6 shadow-sm backdrop-blur-sm">
              <Rating value={testimonial.stars} inverse />
              <p className="mt-3 text-sm leading-6 text-white/90">&ldquo;{testimonial.message}&rdquo;</p>
              <p className="mt-4 text-sm font-medium">{testimonial.customerName}</p>
              <p className="text-xs text-white/65">{testimonial.location}</p>
            </article>
          ))}

          {!isLoading && error && (
            <div className="text-center md:col-span-3">
              <p className="text-sm text-white/80">Testimonials could not be loaded.</p>
              <button type="button" onClick={() => void retry()} className="mt-3 text-sm font-medium text-amber-300 hover:underline">
                Try again
              </button>
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
