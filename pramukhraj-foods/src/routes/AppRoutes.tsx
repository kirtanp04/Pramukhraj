import { useRoutes } from "react-router-dom";
import { LazyRoute } from "@/routes/RouteLoader";
import { lazyNamed } from "@/routes/lazyNamed";

const StorefrontLayout = lazyNamed(() => import("@/components/layout/StorefrontLayout"), "StorefrontLayout");
const AccountLayout = lazyNamed(() => import("@/components/layout/AccountLayout"), "AccountLayout");
const AdminLayout = lazyNamed(() => import("@/components/layout/AdminLayout"), "AdminLayout");
const RequireAuth = lazyNamed(() => import("@/components/admin/RequireAuth"), "RequireAuth");
const PermissionGate = lazyNamed(() => import("@/components/admin/PermissionGate"), "PermissionGate");
const Home = lazyNamed(() => import("@/pages/Home"), "Home");
const ProductListing = lazyNamed(() => import("@/pages/ProductListing"), "ProductListing");
const ProductDetail = lazyNamed(() => import("@/pages/ProductDetail"), "ProductDetail");
const Cart = lazyNamed(() => import("@/pages/Cart"), "Cart");
const Checkout = lazyNamed(() => import("@/pages/Checkout"), "Checkout");
const OrderConfirmation = lazyNamed(() => import("@/pages/OrderConfirmation"), "OrderConfirmation");
const TrackOrder = lazyNamed(() => import("@/pages/TrackOrder"), "TrackOrder");
const Help = lazyNamed(() => import("@/pages/Help"), "Help");
const About = lazyNamed(() => import("@/pages/About"), "About");
const Blog = lazyNamed(() => import("@/pages/Blog"), "Blog");
const BlogPost = lazyNamed(() => import("@/pages/BlogPost"), "BlogPost");
const NotFound = lazyNamed(() => import("@/pages/NotFound"), "NotFound");
const Login = lazyNamed(() => import("@/pages/auth/Login"), "Login");
const Register = lazyNamed(() => import("@/pages/auth/Register"), "Register");
const OtpLogin = lazyNamed(() => import("@/pages/auth/OtpLogin"), "OtpLogin");
const ForgotPassword = lazyNamed(() => import("@/pages/auth/ForgotPassword"), "ForgotPassword");
const ResetPassword = lazyNamed(() => import("@/pages/auth/ResetPassword"), "ResetPassword");
const VerifyEmail = lazyNamed(() => import("@/pages/auth/VerifyEmail"), "VerifyEmail");
const AccountDashboard = lazyNamed(() => import("@/pages/account/AccountDashboard"), "AccountDashboard");
const AccountOrders = lazyNamed(() => import("@/pages/account/AccountOrders"), "AccountOrders");
const AccountWishlist = lazyNamed(() => import("@/pages/account/AccountWishlist"), "AccountWishlist");
const AccountAddresses = lazyNamed(() => import("@/pages/account/AccountAddresses"), "AccountAddresses");
const AccountNotifications = lazyNamed(() => import("@/pages/account/AccountNotifications"), "AccountNotifications");
const AccountWallet = lazyNamed(() => import("@/pages/account/AccountWallet"), "AccountWallet");
const AccountReturns = lazyNamed(() => import("@/pages/account/AccountReturns"), "AccountReturns");
const AccountReviews = lazyNamed(() => import("@/pages/account/AccountReviews"), "AccountReviews");
const AccountSupport = lazyNamed(() => import("@/pages/account/AccountSupport"), "AccountSupport");
const AccountInvoices = lazyNamed(() => import("@/pages/account/AccountInvoices"), "AccountInvoices");
const AccountProfile = lazyNamed(() => import("@/pages/account/AccountProfile"), "AccountProfile");
const AccountSecurity = lazyNamed(() => import("@/pages/account/AccountSecurity"), "AccountSecurity");
const AdminLogin = lazyNamed(() => import("@/pages/admin/AdminLogin"), "AdminLogin");
const AdminDashboard = lazyNamed(() => import("@/pages/admin/AdminDashboard"), "AdminDashboard");
const AdminAnalytics = lazyNamed(() => import("@/pages/admin/AdminAnalytics"), "AdminAnalytics");
const AdminOrders = lazyNamed(() => import("@/pages/admin/AdminOrders"), "AdminOrders");
const AdminProducts = lazyNamed(() => import("@/pages/admin/AdminProducts"), "AdminProducts");
const AdminCategories = lazyNamed(() => import("@/pages/admin/AdminCategories"), "AdminCategories");
const AdminCustomers = lazyNamed(() => import("@/pages/admin/AdminCustomers"), "AdminCustomers");
const AdminReviews = lazyNamed(() => import("@/pages/admin/AdminReviews"), "AdminReviews");
const AdminCoupons = lazyNamed(() => import("@/pages/admin/AdminCoupons"), "AdminCoupons");
const AdminInventory = lazyNamed(() => import("@/pages/admin/AdminInventory"), "AdminInventory");
const AdminSales = lazyNamed(() => import("@/pages/admin/AdminSales"), "AdminSales");
const AdminReturns = lazyNamed(() => import("@/pages/admin/AdminReturns"), "AdminReturns");
const AdminPayments = lazyNamed(() => import("@/pages/admin/AdminPayments"), "AdminPayments");
const AdminShipping = lazyNamed(() => import("@/pages/admin/AdminShipping"), "AdminShipping");
const AdminNotifications = lazyNamed(() => import("@/pages/admin/AdminNotifications"), "AdminNotifications");
const AdminCMS = lazyNamed(() => import("@/pages/admin/AdminCMS"), "AdminCMS");
const AdminBlog = lazyNamed(() => import("@/pages/admin/AdminBlog"), "AdminBlog");
const AdminMedia = lazyNamed(() => import("@/pages/admin/AdminMedia"), "AdminMedia");
const AdminEmailTemplates = lazyNamed(() => import("@/pages/admin/AdminEmailTemplates"), "AdminEmailTemplates");
const AdminRoles = lazyNamed(() => import("@/pages/admin/AdminRoles"), "AdminRoles");
const AdminUsers = lazyNamed(() => import("@/pages/admin/AdminUsers"), "AdminUsers");
const AdminAuditLogs = lazyNamed(() => import("@/pages/admin/AdminAuditLogs"), "AdminAuditLogs");
const AdminSystemHealth = lazyNamed(() => import("@/pages/admin/AdminSystemHealth"), "AdminSystemHealth");
const AdminApiKeys = lazyNamed(() => import("@/pages/admin/AdminApiKeys"), "AdminApiKeys");
const AdminIntegrations = lazyNamed(() => import("@/pages/admin/AdminIntegrations"), "AdminIntegrations");
const AdminFeatureFlags = lazyNamed(() => import("@/pages/admin/AdminFeatureFlags"), "AdminFeatureFlags");
const AdminBackup = lazyNamed(() => import("@/pages/admin/AdminBackup"), "AdminBackup");
const AdminSettings = lazyNamed(() => import("@/pages/admin/AdminSettings"), "AdminSettings");

const lazyElement = (component: Parameters<typeof LazyRoute>[0]["component"]) => <LazyRoute component={component} />;
const protectedAdminRoute = (permission: string, component: Parameters<typeof LazyRoute>[0]["component"]) => (
  <LazyRoute component={PermissionGate} componentProps={{ permission }}>
    {lazyElement(component)}
  </LazyRoute>
);

export function AppRoutes() {
  return useRoutes([
    {
      element: lazyElement(StorefrontLayout),
      children: [
        { path: "/", element: lazyElement(Home) },
        { path: "/products", element: lazyElement(ProductListing) },
        { path: "/category/:categorySlug", element: lazyElement(ProductListing) },
        { path: "/product/:slug", element: lazyElement(ProductDetail) },
        { path: "/cart", element: lazyElement(Cart) },
        { path: "/checkout", element: lazyElement(Checkout) },
        { path: "/order-confirmation", element: lazyElement(OrderConfirmation) },
        { path: "/track-order", element: lazyElement(TrackOrder) },
        { path: "/help", element: lazyElement(Help) },
        { path: "/about", element: lazyElement(About) },
        { path: "/blog", element: lazyElement(Blog) },
        { path: "/blog/:slug", element: lazyElement(BlogPost) },
        { path: "/login", element: lazyElement(Login) },
        { path: "/register", element: lazyElement(Register) },
        { path: "/otp-login", element: lazyElement(OtpLogin) },
        { path: "/forgot-password", element: lazyElement(ForgotPassword) },
        { path: "/reset-password", element: lazyElement(ResetPassword) },
        { path: "/verify-email", element: lazyElement(VerifyEmail) },
        {
          path: "/account",
          element: lazyElement(AccountLayout),
          children: [
            { index: true, element: lazyElement(AccountDashboard) },
            { path: "orders", element: lazyElement(AccountOrders) },
            { path: "wishlist", element: lazyElement(AccountWishlist) },
            { path: "addresses", element: lazyElement(AccountAddresses) },
            { path: "notifications", element: lazyElement(AccountNotifications) },
            { path: "wallet", element: lazyElement(AccountWallet) },
            { path: "returns", element: lazyElement(AccountReturns) },
            { path: "reviews", element: lazyElement(AccountReviews) },
            { path: "support", element: lazyElement(AccountSupport) },
            { path: "invoices", element: lazyElement(AccountInvoices) },
            { path: "profile", element: lazyElement(AccountProfile) },
            { path: "security", element: lazyElement(AccountSecurity) },
          ],
        },
        { path: "*", element: lazyElement(NotFound) },
      ],
    },
    { path: "/admin/login", element: lazyElement(AdminLogin) },
    {
      element: lazyElement(RequireAuth),
      children: [
        {
          path: "/admin",
          element: lazyElement(AdminLayout),
          children: [
            { index: true, element: protectedAdminRoute("dashboard.view", AdminDashboard) },
            { path: "analytics", element: protectedAdminRoute("analytics.view", AdminAnalytics) },
            { path: "orders", element: protectedAdminRoute("orders.view", AdminOrders) },
            { path: "products", element: protectedAdminRoute("products.view", AdminProducts) },
            { path: "categories", element: protectedAdminRoute("categories.view", AdminCategories) },
            { path: "customers", element: protectedAdminRoute("customers.view", AdminCustomers) },
            { path: "reviews", element: protectedAdminRoute("reviews.view", AdminReviews) },
            { path: "coupons", element: protectedAdminRoute("coupons.view", AdminCoupons) },
            { path: "inventory", element: protectedAdminRoute("inventory.view", AdminInventory) },
            { path: "sales", element: protectedAdminRoute("sales.view", AdminSales) },
            { path: "returns", element: protectedAdminRoute("returns.view", AdminReturns) },
            { path: "payments", element: protectedAdminRoute("payments.view", AdminPayments) },
            { path: "shipping", element: protectedAdminRoute("payments.view", AdminShipping) },
            { path: "notifications", element: protectedAdminRoute("cms.view", AdminNotifications) },
            { path: "cms", element: protectedAdminRoute("cms.view", AdminCMS) },
            { path: "blog", element: protectedAdminRoute("blog.view", AdminBlog) },
            { path: "media", element: protectedAdminRoute("media.view", AdminMedia) },
            { path: "email-templates", element: protectedAdminRoute("cms.view", AdminEmailTemplates) },
            { path: "roles", element: protectedAdminRoute("roles.view", AdminRoles) },
            { path: "users", element: protectedAdminRoute("users.view", AdminUsers) },
            { path: "audit-logs", element: protectedAdminRoute("settings.view", AdminAuditLogs) },
            { path: "system-health", element: protectedAdminRoute("settings.view", AdminSystemHealth) },
            { path: "api-keys", element: protectedAdminRoute("settings.view", AdminApiKeys) },
            { path: "integrations", element: protectedAdminRoute("settings.view", AdminIntegrations) },
            { path: "feature-flags", element: protectedAdminRoute("settings.view", AdminFeatureFlags) },
            { path: "backup", element: protectedAdminRoute("settings.manage", AdminBackup) },
            { path: "settings", element: protectedAdminRoute("settings.view", AdminSettings) },
          ],
        },
      ],
    },
  ]);
}
