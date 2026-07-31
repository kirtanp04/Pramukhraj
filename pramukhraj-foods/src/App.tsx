import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import { StorefrontLayout } from '@/components/layout/StorefrontLayout'
import { AccountLayout } from '@/components/layout/AccountLayout'
import { RequireAuth } from '@/components/admin/RequireAuth'
import { PermissionGate } from '@/components/admin/PermissionGate'
import { useUIStore } from '@/store/uiStore'

// Admin console is code-split into its own chunk — it pulls in recharts and
// react-table, which the storefront never needs.
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })))
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics').then((m) => ({ default: m.AdminAnalytics })))
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })))
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })))
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })))
const AdminCustomers = lazy(() => import('@/pages/admin/AdminCustomers').then((m) => ({ default: m.AdminCustomers })))
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews').then((m) => ({ default: m.AdminReviews })))
const AdminCoupons = lazy(() => import('@/pages/admin/AdminCoupons').then((m) => ({ default: m.AdminCoupons })))
const AdminInventory = lazy(() => import('@/pages/admin/AdminInventory').then((m) => ({ default: m.AdminInventory })))
const AdminSales = lazy(() => import('@/pages/admin/AdminSales').then((m) => ({ default: m.AdminSales })))
const AdminReturns = lazy(() => import('@/pages/admin/AdminReturns').then((m) => ({ default: m.AdminReturns })))
const AdminPayments = lazy(() => import('@/pages/admin/AdminPayments').then((m) => ({ default: m.AdminPayments })))
const AdminShipping = lazy(() => import('@/pages/admin/AdminShipping').then((m) => ({ default: m.AdminShipping })))
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications').then((m) => ({ default: m.AdminNotifications })))
const AdminCMS = lazy(() => import('@/pages/admin/AdminCMS').then((m) => ({ default: m.AdminCMS })))
const AdminBlog = lazy(() => import('@/pages/admin/AdminBlog').then((m) => ({ default: m.AdminBlog })))
const AdminMedia = lazy(() => import('@/pages/admin/AdminMedia').then((m) => ({ default: m.AdminMedia })))
const AdminEmailTemplates = lazy(() => import('@/pages/admin/AdminEmailTemplates').then((m) => ({ default: m.AdminEmailTemplates })))
const AdminRoles = lazy(() => import('@/pages/admin/AdminRoles').then((m) => ({ default: m.AdminRoles })))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })))
const AdminAuditLogs = lazy(() => import('@/pages/admin/AdminAuditLogs').then((m) => ({ default: m.AdminAuditLogs })))
const AdminSystemHealth = lazy(() => import('@/pages/admin/AdminSystemHealth').then((m) => ({ default: m.AdminSystemHealth })))
const AdminApiKeys = lazy(() => import('@/pages/admin/AdminApiKeys').then((m) => ({ default: m.AdminApiKeys })))
const AdminIntegrations = lazy(() => import('@/pages/admin/AdminIntegrations').then((m) => ({ default: m.AdminIntegrations })))
const AdminFeatureFlags = lazy(() => import('@/pages/admin/AdminFeatureFlags').then((m) => ({ default: m.AdminFeatureFlags })))
const AdminBackup = lazy(() => import('@/pages/admin/AdminBackup').then((m) => ({ default: m.AdminBackup })))
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })))

import { Home } from '@/pages/Home'
import { ProductListing } from '@/pages/ProductListing'
import { ProductDetail } from '@/pages/ProductDetail'
import { Cart } from '@/pages/Cart'
import { Checkout } from '@/pages/Checkout'
import { OrderConfirmation } from '@/pages/OrderConfirmation'
import { TrackOrder } from '@/pages/TrackOrder'
import { Help } from '@/pages/Help'
import { About } from '@/pages/About'
import { Blog } from '@/pages/Blog'
import { BlogPost } from '@/pages/BlogPost'
import { NotFound } from '@/pages/NotFound'

import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { OtpLogin } from '@/pages/auth/OtpLogin'
import { ForgotPassword } from '@/pages/auth/ForgotPassword'
import { ResetPassword } from '@/pages/auth/ResetPassword'
import { VerifyEmail } from '@/pages/auth/VerifyEmail'

import { AccountDashboard } from '@/pages/account/AccountDashboard'
import { AccountOrders } from '@/pages/account/AccountOrders'
import { AccountWishlist } from '@/pages/account/AccountWishlist'
import { AccountAddresses } from '@/pages/account/AccountAddresses'
import { AccountNotifications } from '@/pages/account/AccountNotifications'
import { AccountWallet } from '@/pages/account/AccountWallet'
import { AccountReturns } from '@/pages/account/AccountReturns'
import { AccountReviews } from '@/pages/account/AccountReviews'
import { AccountSupport } from '@/pages/account/AccountSupport'
import { AccountInvoices } from '@/pages/account/AccountInvoices'
import { AccountProfile } from '@/pages/account/AccountProfile'
import { AccountSecurity } from '@/pages/account/AccountSecurity'

export default function App() {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductListing />} />
          <Route path="/category/:categorySlug" element={<ProductListing />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/otp-login" element={<OtpLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountDashboard />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="wishlist" element={<AccountWishlist />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="notifications" element={<AccountNotifications />} />
            <Route path="wallet" element={<AccountWallet />} />
            <Route path="returns" element={<AccountReturns />} />
            <Route path="reviews" element={<AccountReviews />} />
            <Route path="support" element={<AccountSupport />} />
            <Route path="invoices" element={<AccountInvoices />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="security" element={<AccountSecurity />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<Suspense fallback={<AdminLoading />}><AdminLogin /></Suspense>} />
        <Route element={<RequireAuth />}>
          <Route path="/admin" element={<Suspense fallback={<AdminLoading />}><AdminLayout /></Suspense>}>
            <Route index element={<PermissionGate permission="dashboard.view"><AdminDashboard /></PermissionGate>} />
            <Route path="analytics" element={<PermissionGate permission="analytics.view"><AdminAnalytics /></PermissionGate>} />
            <Route path="orders" element={<PermissionGate permission="orders.view"><AdminOrders /></PermissionGate>} />
            <Route path="products" element={<PermissionGate permission="products.view"><AdminProducts /></PermissionGate>} />
            <Route path="categories" element={<PermissionGate permission="categories.view"><AdminCategories /></PermissionGate>} />
            <Route path="customers" element={<PermissionGate permission="customers.view"><AdminCustomers /></PermissionGate>} />
            <Route path="reviews" element={<PermissionGate permission="reviews.view"><AdminReviews /></PermissionGate>} />
            <Route path="coupons" element={<PermissionGate permission="coupons.view"><AdminCoupons /></PermissionGate>} />
            <Route path="inventory" element={<PermissionGate permission="inventory.view"><AdminInventory /></PermissionGate>} />
            <Route path="sales" element={<PermissionGate permission="sales.view"><AdminSales /></PermissionGate>} />
            <Route path="returns" element={<PermissionGate permission="returns.view"><AdminReturns /></PermissionGate>} />
            <Route path="payments" element={<PermissionGate permission="payments.view"><AdminPayments /></PermissionGate>} />
            <Route path="shipping" element={<PermissionGate permission="payments.view"><AdminShipping /></PermissionGate>} />
            <Route path="notifications" element={<PermissionGate permission="cms.view"><AdminNotifications /></PermissionGate>} />
            <Route path="cms" element={<PermissionGate permission="cms.view"><AdminCMS /></PermissionGate>} />
            <Route path="blog" element={<PermissionGate permission="blog.view"><AdminBlog /></PermissionGate>} />
            <Route path="media" element={<PermissionGate permission="media.view"><AdminMedia /></PermissionGate>} />
            <Route path="email-templates" element={<PermissionGate permission="cms.view"><AdminEmailTemplates /></PermissionGate>} />
            <Route path="roles" element={<PermissionGate permission="roles.view"><AdminRoles /></PermissionGate>} />
            <Route path="users" element={<PermissionGate permission="users.view"><AdminUsers /></PermissionGate>} />
            <Route path="audit-logs" element={<PermissionGate permission="settings.view"><AdminAuditLogs /></PermissionGate>} />
            <Route path="system-health" element={<PermissionGate permission="settings.view"><AdminSystemHealth /></PermissionGate>} />
            <Route path="api-keys" element={<PermissionGate permission="settings.view"><AdminApiKeys /></PermissionGate>} />
            <Route path="integrations" element={<PermissionGate permission="settings.view"><AdminIntegrations /></PermissionGate>} />
            <Route path="feature-flags" element={<PermissionGate permission="settings.view"><AdminFeatureFlags /></PermissionGate>} />
            <Route path="backup" element={<PermissionGate permission="settings.manage"><AdminBackup /></PermissionGate>} />
            <Route path="settings" element={<PermissionGate permission="settings.view"><AdminSettings /></PermissionGate>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-teal-deep">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ivory/20 border-t-turmeric" />
    </div>
  )
}
