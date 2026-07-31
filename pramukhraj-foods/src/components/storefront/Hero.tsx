import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Truck, ShieldCheck, Leaf } from 'lucide-react'
import { categories } from '@/mock'
import { Button } from '@/components/ui/Button'

// Six categories arranged like compartments around a steel thali —
// a nod to how the brand's products are traditionally served.
const orbitCategories = categories.slice(0, 6)
const positions = [
  { top: '2%', left: '38%' },
  { top: '18%', left: '4%' },
  { top: '18%', left: '72%' },
  { top: '58%', left: '0%' },
  { top: '58%', left: '76%' },
  { top: '78%', left: '38%' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink/10 bg-gradient-to-b from-tan/60 to-ivory">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:px-6 lg:grid-cols-2 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="stamp-badge mb-4 inline-block rounded-full bg-oxblood/10 px-3 py-1 text-xs text-oxblood">
            Est. 2026 · Ahmedabad, Gujarat
          </span>
          <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Traditional taste,
            <br />
            <span className="text-oxblood">modern shopping.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-ink-soft">
            Hand-rolled papad, stone-ground masala and small-batch sweets — sourced from home kitchens across
            Gujarat and shipped to your door.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/products">Shop All Products <ArrowRight size={16} /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/category/festival-specials">Festival Specials</Link>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-sm grid-cols-3 gap-4 border-t border-ink/10 pt-6">
            <div>
              <dt className="sr-only">Happy customers</dt>
              <dd className="font-display text-2xl">40k+</dd>
              <dd className="text-xs text-ink-soft">Happy customers</dd>
            </div>
            <div>
              <dt className="sr-only">Products</dt>
              <dd className="font-display text-2xl">200+</dd>
              <dd className="text-xs text-ink-soft">Products</dd>
            </div>
            <div>
              <dt className="sr-only">Rating</dt>
              <dd className="font-display text-2xl">4.7★</dd>
              <dd className="text-xs text-ink-soft">Avg. rating</dd>
            </div>
          </dl>
        </motion.div>

        <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block">
          <div className="absolute inset-[14%] rounded-full border border-dashed border-oxblood/25" />
          <div className="absolute inset-[28%] flex items-center justify-center rounded-full bg-ivory-dim shadow-inner">
            <span className="stamp-badge px-2 text-center text-[11px] text-ink-soft">Fresh from<br />our kitchens</span>
          </div>
          {orbitCategories.map((c, i) => (
            <motion.div
              key={c.id}
              className="absolute h-24 w-24"
              style={positions[i]}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
              transition={{
                opacity: { delay: 0.1 * i, duration: 0.4 },
                scale: { delay: 0.1 * i, duration: 0.4 },
                y: { repeat: Infinity, duration: 4 + i * 0.3, ease: 'easeInOut', delay: i * 0.2 },
              }}
            >
              <Link to={`/category/${c.slug}`} className="group block h-full w-full">
                <div className="h-full w-full overflow-hidden rounded-full border-2 border-ivory bg-tan shadow-md">
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                </div>
                <p className="mt-1.5 text-center text-xs font-medium">{c.name}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mobile category grid fallback */}
        <div className="grid grid-cols-3 gap-4 lg:hidden">
          {orbitCategories.map((c) => (
            <Link key={c.id} to={`/category/${c.slug}`} className="flex flex-col items-center gap-1.5">
              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-ivory bg-tan shadow">
                <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
              </div>
              <p className="text-center text-[11px]">{c.name}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-ink/10 bg-ivory-dim">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 sm:grid-cols-3">
          {[
            { icon: Truck, title: 'Free shipping over ₹499', desc: 'Delivered in 2–5 business days' },
            { icon: ShieldCheck, title: '7-day easy returns', desc: 'Unopened packs, no questions asked' },
            { icon: Leaf, title: 'No preservatives', desc: 'Small-batch, made fresh to order' },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <f.icon size={22} className="shrink-0 text-oxblood" />
              <div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-ink-soft">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
