import { Rating } from '@/components/ui/Rating'

const testimonials = [
  { name: 'Priya Shah', city: 'Mumbai', text: 'The khakhra tastes just like my grandmother used to make. Ordering monthly now.', rating: 5 },
  { name: 'Rohan Mehta', city: 'Bengaluru', text: 'Fast delivery and the gift box packaging was beautiful for Diwali gifting.', rating: 5 },
  { name: 'Ananya Iyer', city: 'Pune', text: 'Finally found authentic Gujarati pickles outside of Gujarat. Highly recommend.', rating: 4 },
]

export function Testimonials() {
  return (
    <section className="bg-teal py-14 text-ivory">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <p className="mb-1 text-center text-xs font-medium uppercase tracking-wider text-turmeric">What customers say</p>
        <h2 className="mb-10 text-center font-display text-3xl">Loved across India</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="scallop-top rounded-card bg-ivory/5 p-6 pt-8">
              <Rating value={t.rating} />
              <p className="mt-3 text-sm text-ivory/85">&ldquo;{t.text}&rdquo;</p>
              <p className="mt-4 text-sm font-medium">{t.name}</p>
              <p className="text-xs text-ivory/60">{t.city}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
