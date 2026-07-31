import { Link } from 'react-router-dom'
import { Smartphone, Send } from 'lucide-react'
import { Logo } from './Logo'
import { Button } from '@/components/ui/Button'

const socialLinks = ['IG', 'FB', 'X', 'YT']

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/products' },
      { label: "Today's Deals", to: '/products?deals=1' },
      { label: 'New Arrivals', to: '/products?sort=newest' },
      { label: 'Gift Packs', to: '/category/gift-packs' },
      { label: 'Festival Specials', to: '/category/festival-specials' },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'Track Order', to: '/track-order' },
      { label: 'Returns & Refunds', to: '/help' },
      { label: 'Shipping Info', to: '/help' },
      { label: 'FAQ', to: '/help' },
      { label: 'Contact Us', to: '/help' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About PramukhRaj', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/about' },
      { label: 'Sustainability', to: '/about' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-teal text-ivory">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          <div>
            <Logo className="text-ivory" />
            <p className="mt-4 max-w-xs text-sm text-ivory/70">
              Traditional taste, modern shopping. Small-batch Indian snacks, spices and sweets, packed fresh and shipped nationwide.
            </p>
            <div className="mt-5 flex gap-3">
              {socialLinks.map((label) => (
                <a key={label} href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory/10 text-[11px] font-semibold hover:bg-ivory/20">
                  {label}
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-turmeric">{col.title}</h4>
              <ul className="space-y-2 text-sm text-ivory/75">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="hover:text-ivory">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-turmeric">Stay Updated</h4>
            <p className="mb-3 text-sm text-ivory/75">Get offers &amp; new arrivals in your inbox.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-full bg-ivory/10 px-4 py-2 text-sm placeholder:text-ivory/50 outline-none focus:bg-ivory/15"
              />
              <button aria-label="Subscribe" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-turmeric text-teal-deep">
                <Send size={15} />
              </button>
            </form>
            <Button variant="dark" size="sm" className="mt-5 border border-ivory/20">
              <Smartphone size={14} /> Get the App
            </Button>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ivory/10 pt-6 text-xs text-ivory/60 sm:flex-row">
          <p>© 2026 PramukhRaj Foods Pvt. Ltd. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/help" className="hover:text-ivory">Privacy Policy</Link>
            <Link to="/help" className="hover:text-ivory">Terms of Service</Link>
            <Link to="/admin/login" className="hover:text-ivory">Admin Console</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
