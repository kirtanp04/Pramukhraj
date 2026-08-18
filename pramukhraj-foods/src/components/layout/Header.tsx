import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingBag,  Menu, X, ChevronDown, MapPin, Truck } from 'lucide-react'
import { Logo } from './Logo'
import { SearchBar } from './SearchBar'
import { categories } from '@/mock'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/lib/utils'

export function Header() {
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const lines = useCartStore((s) => s.lines)
  const wishlist = useCartStore((s) => s.wishlist)
  const openCart = useCartStore((s) => s.openCart)

  const cartCount = lines.reduce((sum, l) => sum + l.quantity, 0)

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-ivory/90 backdrop-blur-md">
      {/* Utility bar */}
      <div className="hidden bg-teal text-ivory md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><MapPin size={12} /> Deliver to Ahmedabad, 380001</span>
            <span className="flex items-center gap-1"><Truck size={12} /> Free shipping over ₹499</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/track-order" className="hover:text-turmeric">Track Order</Link>
            <Link to="/help" className="hover:text-turmeric">Help</Link>
            {/* <button className="hover:text-turmeric">EN</button> */}
            <button className="hover:text-turmeric">INR ₹</button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <button className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <Link to="/" className="shrink-0 text-ink">
          <Logo />
        </Link>

        <SearchBar className="hidden md:block md:max-w-md lg:max-w-lg" />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </motion.span>
            </AnimatePresence>
          </button> */}
          <Link to="/account/wishlist" aria-label="Wishlist" className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5">
            <Heart size={18} />
            {wishlist.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-oxblood px-1 text-[9px] font-medium text-ivory">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button
            onClick={openCart}
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-oxblood px-1 text-[9px] font-medium text-ivory">
                {cartCount}
              </span>
            )}
          </button>
          <Link to="/account" className="hidden h-9 items-center gap-1.5 rounded-full border border-ink/15 px-3 text-sm hover:bg-ink/5 sm:flex">
            Account
          </Link>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <SearchBar />
      </div>

      {/* Category nav / mega menu */}
      <nav className="hidden border-t border-ink/10 md:block" onMouseLeave={() => setMegaOpen(false)}>
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-2.5 text-sm">
          <button
            onMouseEnter={() => setMegaOpen(true)}
            className="flex items-center gap-1 font-medium text-oxblood"
          >
            All Categories <ChevronDown size={14} className={cn('transition-transform', megaOpen && 'rotate-180')} />
          </button>
          <Link to="/products?sort=newest" className="text-ink-soft hover:text-ink">New Arrivals</Link>
          <Link to="/products?deals=1" className="text-ink-soft hover:text-ink">Today's Deals</Link>
          <Link to="/category/gift-packs" className="text-ink-soft hover:text-ink">Gift Packs</Link>
          <Link to="/category/festival-specials" className="text-ink-soft hover:text-ink">Festival Specials</Link>
          <Link to="/category/organic" className="text-ink-soft hover:text-ink">Organic</Link>
          <Link to="/blog" className="text-ink-soft hover:text-ink">Blog</Link>
        </div>

        <AnimatePresence>
          {megaOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              onMouseEnter={() => setMegaOpen(true)}
              className="absolute left-0 right-0 border-t border-ink/10 bg-ivory shadow-xl"
            >
              <div className="mx-auto grid max-w-7xl grid-cols-4 gap-x-8 gap-y-4 px-6 py-6 lg:grid-cols-6">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    onClick={() => setMegaOpen(false)}
                    className="group flex items-center gap-3 rounded-lg p-1.5 hover:bg-tan/50"
                  >
                    <img src={c.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-medium group-hover:text-oxblood">{c.name}</p>
                      <p className="text-xs text-ink-soft">{c.productCount} items</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-ink/40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[82%] max-w-xs overflow-y-auto bg-ivory p-5 md:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <Logo />
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button>
              </div>
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">Categories</p>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/category/${c.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-tan/50"
                    >
                      <img src={c.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                      <span className="text-sm">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
