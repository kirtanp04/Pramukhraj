import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, Heart, MapPin, Bell, Wallet, RotateCcw, Star, Headset, FileText, User, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/account', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/notifications', label: 'Notifications', icon: Bell },
  { to: '/account/wallet', label: 'Wallet & Rewards', icon: Wallet },
  { to: '/account/returns', label: 'Returns', icon: RotateCcw },
  { to: '/account/reviews', label: 'Reviews', icon: Star },
  { to: '/account/support', label: 'Support Tickets', icon: Headset },
  { to: '/account/invoices', label: 'Invoices', icon: FileText },
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/security', label: 'Security', icon: ShieldCheck },
]

export function AccountLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="font-display text-3xl">My Account</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2 text-sm lg:rounded-lg',
                  isActive ? 'bg-oxblood text-ivory' : 'text-ink-soft hover:bg-ink/5',
                )
              }
            >
              <item.icon size={15} /> {item.label}
            </NavLink>
          ))}
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
