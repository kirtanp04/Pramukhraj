import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { CartDrawer } from '@/components/storefront/CartDrawer'
import { CustomerCategoriesProvider } from '@/contexts/CustomerCategoriesProvider'

export function StorefrontLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <CustomerCategoriesProvider>
      <div className="flex min-h-screen flex-col bg-ivory text-ink">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CartDrawer />
      </div>
    </CustomerCategoriesProvider>
  )
}
