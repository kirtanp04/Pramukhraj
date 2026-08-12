import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Bell, Search, LogOut, Settings, ChevronDown, Sun, Moon, ExternalLink } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Badge } from '@/components/ui/Badge'
import { adminNavGroups } from '@/constants/adminNav'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { getRole, getRoleIdByName } from '@/mock/roles'
import { cn } from '@/lib/utils'

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const logout = useAuthStore((s) => s.logout)
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const navigate = useNavigate()
  const role = getRole(getRoleIdByName(user?.role ?? '') ?? '')

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Logo className="text-ivory" />
        <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {adminNavGroups.map((group) => {
          const visibleItems = group.items.filter((item) => hasPermission(item.permission))
          if (visibleItems.length === 0) return null
          return (
            <div key={group.title}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-ivory/35">{group.title}</p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive ? 'bg-turmeric text-teal-deep font-medium' : 'text-ivory/70 hover:bg-ivory/10 hover:text-ivory',
                      )
                    }
                  >
                    <item.icon size={16} /> {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>
      <div className="border-t border-ivory/10 p-4">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-ivory/60 hover:bg-ivory/10 hover:text-ivory">
          <ExternalLink size={14} /> View storefront
        </a>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-ivory text-ink">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 bg-teal-deep text-ivory lg:block">{SidebarContent}</aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-ink/50 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-teal-deep text-ivory lg:hidden"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/10 bg-ivory/90 px-4 py-3 backdrop-blur md:px-6">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="hidden items-center gap-2 rounded-full border border-ink/15 bg-ivory-dim px-3 py-1.5 md:flex md:w-72">
            <Search size={14} className="text-ink-soft" />
            <input placeholder="Search orders, products, customers..." className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/60" />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {role && <Badge variant={role.color} className="hidden sm:inline-flex">{role.name}</Badge>}
            <button onClick={toggleTheme} aria-label="Toggle theme" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5">
              {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5">
              <Bell size={17} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-oxblood" />
            </button>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-ink/5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-xs font-semibold text-ivory" aria-hidden="true">
                    {user?.username?.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="hidden text-sm font-medium sm:block">{user?.username}</span>
                  <ChevronDown size={14} className="hidden text-ink-soft sm:block" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={8} className="z-40 min-w-52 rounded-xl border border-ink/10 bg-ivory p-1.5 shadow-xl">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-ink-soft">{user?.email}</p>
                  </div>
                  <DropdownMenu.Separator className="my-1 h-px bg-ink/10" />
                  <DropdownMenu.Item asChild>
                    <NavLink to="/admin/settings" className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none hover:bg-ink/5">
                      <Settings size={14} /> Settings
                    </NavLink>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={handleLogout} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-oxblood outline-none hover:bg-oxblood/5">
                    <LogOut size={14} /> Log Out
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
