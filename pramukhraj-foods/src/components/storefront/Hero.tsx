import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Truck, ShieldCheck, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { HeroBanner } from '@/components/storefront/HeroBanner'

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-ink/10 bg-gradient-to-br from-ivory via-ivory to-tan/55">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-[58%] opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(45deg, color-mix(in srgb, var(--color-oxblood) 9%, transparent) 1px, transparent 1px), linear-gradient(-45deg, color-mix(in srgb, var(--color-oxblood) 9%, transparent) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          maskImage: 'linear-gradient(to right, black 0%, transparent 82%)',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-20 -z-10 h-72 w-72 rounded-full bg-oxblood/5 blur-3xl" />

      <div className="mx-auto  grid max-w-7xl items-center gap-10 px-4 py-10 sm:py-14 md:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14 lg:py-20 xl:gap-20">
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="stamp-badge mb-5 flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-oxblood">
            <span className="h-2 w-2 rounded-full bg-oxblood" />
            Since 1997 · Gujarat
          </div>

          <h1 className="max-w-xl font-display text-[2.8rem] leading-[0.98] tracking-[-0.035em] min-[420px]:text-5xl sm:text-6xl lg:text-[4.35rem]">
            Traditional taste,
            <br />
            <span className="italic text-oxblood">modern shopping.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-ink-soft">
            Hand-rolled papad, stone-ground masala and small-batch sweets — sourced from home kitchens across
            Gujarat and shipped to your door.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <Button
              size="lg"
              className="w-full px-4 text-sm shadow-[0_10px_30px_-12px_color-mix(in_srgb,var(--color-oxblood)_70%,transparent)] sm:w-auto sm:px-7 sm:text-base"
              asChild
            >
              <Link to="/products">Shop All Products <ArrowRight size={16} /></Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full px-4 text-sm sm:w-auto sm:px-7 sm:text-base" asChild>
              <Link to="/category/festival-specials">Festival Specials</Link>
            </Button>
          </div>

          <dl className="mt-11 grid max-w-lg grid-cols-3 divide-x divide-ink/10 border-t border-ink/10 pt-6">
            <div className="pr-4">
              <dt className="sr-only">Happy customers</dt>
              <dd className="font-display text-2xl font-medium sm:text-3xl">40k+</dd>
              <dd className="mt-0.5 text-[11px] text-ink-soft sm:text-xs">Happy customers</dd>
            </div>
            <div className="px-4 sm:px-6">
              <dt className="sr-only">Products</dt>
              <dd className="font-display text-2xl font-medium sm:text-3xl">200+</dd>
              <dd className="mt-0.5 text-[11px] text-ink-soft sm:text-xs">Products</dd>
            </div>
            <div className="pl-4 sm:pl-6">
              <dt className="sr-only">Rating</dt>
              <dd className="font-display text-2xl font-medium sm:text-3xl">4.7★</dd>
              <dd className="mt-0.5 text-[11px] text-ink-soft sm:text-xs">Avg. rating</dd>
            </div>
          </dl>
        </motion.div>

        <motion.div
          className="relative min-w-0 lg:-mr-6 xl:-mr-10"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.08 }}
        >
          <div aria-hidden="true" className="absolute -right-2 -top-2 h-full w-full border border-oxblood/15 sm:-right-3 sm:-top-3" />
          <HeroBanner />
        </motion.div>
      </div>

      <div className="relative z-10 border-t border-ink/10 bg-ivory-dim/95 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-3 gap-2 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6">
          {[
            { icon: Truck, title: 'Free shipping over ₹499', desc: 'Delivered in 2–5 business days' },
            { icon: ShieldCheck, title: '7-day easy returns', desc: 'Unopened packs, no questions asked' },
            { icon: Leaf, title: 'No preservatives', desc: 'Small-batch, made fresh to order' },
          ].map((feature) => (
            <div key={feature.title} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-oxblood/8 text-oxblood">
                <feature.icon size={20} />
              </div>
              <div>
                <p className="text-[11px] font-medium leading-tight sm:text-sm">{feature.title}</p>
                <p className="mt-0.5 hidden text-xs text-ink-soft sm:block">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
