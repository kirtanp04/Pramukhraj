import { Outlet, useRoutes } from "react-router-dom";
import { LazyRoute } from "@/routes/RouteLoader";
import { lazyNamed } from "@/routes/lazyNamed";
import AdminAuthWrapper from "@/components/admin/AdminAuthWrapper";

const StorefrontLayout = lazyNamed(
  () => import("@/components/layout/StorefrontLayout"),
  "StorefrontLayout"
);
const AccountLayout = lazyNamed(
  () => import("@/components/layout/AccountLayout"),
  "AccountLayout"
);
const AdminLayout = lazyNamed(
  () => import("@/components/layout/AdminLayout"),
  "AdminLayout"
);
const RequireAuth = lazyNamed(
  () => import("@/components/admin/RequireAuth"),
  "RequireAuth"
);
const Home = lazyNamed(() => import("@/pages/Home"), "Home");
const ProductListing = lazyNamed(
  () => import("@/pages/ProductListing"),
  "ProductListing"
);
const ProductDetail = lazyNamed(
  () => import("@/pages/ProductDetail"),
  "ProductDetail"
);
const Cart = lazyNamed(() => import("@/pages/Cart"), "Cart");
const Checkout = lazyNamed(() => import("@/pages/Checkout"), "Checkout");
const OrderConfirmation = lazyNamed(
  () => import("@/pages/OrderConfirmation"),
  "OrderConfirmation"
);
const TrackOrder = lazyNamed(() => import("@/pages/TrackOrder"), "TrackOrder");
const Help = lazyNamed(() => import("@/pages/Help"), "Help");
const About = lazyNamed(() => import("@/pages/About"), "About");
const Blog = lazyNamed(() => import("@/pages/Blog"), "Blog");
const BlogPost = lazyNamed(() => import("@/pages/BlogPost"), "BlogPost");
const NotFound = lazyNamed(() => import("@/pages/NotFound"), "NotFound");
const Login = lazyNamed(() => import("@/pages/auth/Login"), "Login");
const Register = lazyNamed(() => import("@/pages/auth/Register"), "Register");
const OtpLogin = lazyNamed(() => import("@/pages/auth/OtpLogin"), "OtpLogin");
const ForgotPassword = lazyNamed(
  () => import("@/pages/auth/ForgotPassword"),
  "ForgotPassword"
);
const ResetPassword = lazyNamed(
  () => import("@/pages/auth/ResetPassword"),
  "ResetPassword"
);
const VerifyEmail = lazyNamed(
  () => import("@/pages/auth/VerifyEmail"),
  "VerifyEmail"
);
const AccountDashboard = lazyNamed(
  () => import("@/pages/account/AccountDashboard"),
  "AccountDashboard"
);
const AccountOrders = lazyNamed(
  () => import("@/pages/account/AccountOrders"),
  "AccountOrders"
);
const AccountWishlist = lazyNamed(
  () => import("@/pages/account/AccountWishlist"),
  "AccountWishlist"
);
const AccountAddresses = lazyNamed(
  () => import("@/pages/account/AccountAddresses"),
  "AccountAddresses"
);
const AccountNotifications = lazyNamed(
  () => import("@/pages/account/AccountNotifications"),
  "AccountNotifications"
);
const AccountWallet = lazyNamed(
  () => import("@/pages/account/AccountWallet"),
  "AccountWallet"
);
const AccountReturns = lazyNamed(
  () => import("@/pages/account/AccountReturns"),
  "AccountReturns"
);
const AccountReviews = lazyNamed(
  () => import("@/pages/account/AccountReviews"),
  "AccountReviews"
);
const AccountSupport = lazyNamed(
  () => import("@/pages/account/AccountSupport"),
  "AccountSupport"
);
const AccountInvoices = lazyNamed(
  () => import("@/pages/account/AccountInvoices"),
  "AccountInvoices"
);
const AccountProfile = lazyNamed(
  () => import("@/pages/account/AccountProfile"),
  "AccountProfile"
);
const AccountSecurity = lazyNamed(
  () => import("@/pages/account/AccountSecurity"),
  "AccountSecurity"
);
// const AdminLogin = lazyNamed(() => import("@/pages/admin/AdminLogin"), "AdminLogin");
const AdminDashboard = lazyNamed(
  () => import("@/pages/admin/AdminDashboard"),
  "AdminDashboard"
);
const AdminAnalytics = lazyNamed(
  () => import("@/pages/admin/AdminAnalytics"),
  "AdminAnalytics"
);
const AdminOrders = lazyNamed(
  () => import("@/pages/admin/AdminOrders"),
  "AdminOrders"
);
const AdminProducts = lazyNamed(
  () => import("@/pages/admin/product/AdminProducts"),
  "AdminProducts"
);
const AdminAddProducts = lazyNamed(
  () => import("@/pages/admin/product/AdminProductFormPage"),
  "ProductFormPage"
);
const AdminCategories = lazyNamed(
  () => import("@/pages/admin/category/AdminCategories"),
  "AdminCategories"
);
const AdminAddCategory = lazyNamed(
  () => import("@/pages/admin/category/AdminCategoryFormPage"),
  "AdminCategoryFormPage"
);
const AdminCustomers = lazyNamed(
  () => import("@/pages/admin/AdminCustomers"),
  "AdminCustomers"
);
const AdminReviews = lazyNamed(
  () => import("@/pages/admin/AdminReviews"),
  "AdminReviews"
);
const AdminCoupons = lazyNamed(
  () => import("@/pages/admin/AdminCoupons"),
  "AdminCoupons"
);
const AdminInventory = lazyNamed(
  () => import("@/pages/admin/AdminInventory"),
  "AdminInventory"
);
const AdminSales = lazyNamed(
  () => import("@/pages/admin/AdminSales"),
  "AdminSales"
);
const AdminReturns = lazyNamed(
  () => import("@/pages/admin/AdminReturns"),
  "AdminReturns"
);
const AdminPayments = lazyNamed(
  () => import("@/pages/admin/AdminPayments"),
  "AdminPayments"
);
const AdminShipping = lazyNamed(
  () => import("@/pages/admin/AdminShipping"),
  "AdminShipping"
);
const AdminNotifications = lazyNamed(
  () => import("@/pages/admin/AdminNotifications"),
  "AdminNotifications"
);
const AdminCMS = lazyNamed(() => import("@/pages/admin/AdminCMS"), "AdminCMS");
const AdminBlog = lazyNamed(
  () => import("@/pages/admin/AdminBlog"),
  "AdminBlog"
);
const AdminMedia = lazyNamed(
  () => import("@/pages/admin/AdminMedia"),
  "AdminMedia"
);
const AdminEmailTemplates = lazyNamed(
  () => import("@/pages/admin/AdminEmailTemplates"),
  "AdminEmailTemplates"
);
const AdminUsers = lazyNamed(
  () => import("@/pages/admin/AdminUsers"),
  "AdminUsers"
);
const AdminAuditLogs = lazyNamed(
  () => import("@/pages/admin/AdminAuditLogs"),
  "AdminAuditLogs"
);
const AdminSystemHealth = lazyNamed(
  () => import("@/pages/admin/AdminSystemHealth"),
  "AdminSystemHealth"
);
const AdminApiKeys = lazyNamed(
  () => import("@/pages/admin/AdminApiKeys"),
  "AdminApiKeys"
);
const AdminIntegrations = lazyNamed(
  () => import("@/pages/admin/AdminIntegrations"),
  "AdminIntegrations"
);
const AdminFeatureFlags = lazyNamed(
  () => import("@/pages/admin/AdminFeatureFlags"),
  "AdminFeatureFlags"
);
const AdminBackup = lazyNamed(
  () => import("@/pages/admin/AdminBackup"),
  "AdminBackup"
);
const AdminSettings = lazyNamed(
  () => import("@/pages/admin/AdminSettings"),
  "AdminSettings"
);

const lazyElement = (
  component: Parameters<typeof LazyRoute>[0]["component"]
) => <LazyRoute component={component} />;

export function AppRoutes() {
  return useRoutes([
    {
      element: lazyElement(StorefrontLayout),
      children: [
        { path: "/", element: lazyElement(Home) },
        { path: "/products", element: lazyElement(ProductListing) },
        {
          path: "/category/:categorySlug",
          element: lazyElement(ProductListing),
        },
        { path: "/product/:slug", element: lazyElement(ProductDetail) },
        { path: "/cart", element: lazyElement(Cart) },
        { path: "/checkout", element: lazyElement(Checkout) },
        {
          path: "/order-confirmation",
          element: lazyElement(OrderConfirmation),
        },
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
            {
              path: "notifications",
              element: lazyElement(AccountNotifications),
            },
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
    // { path: "/admin/login", element: lazyElement(AdminLogin) },
    {
      element: <AdminAuthWrapper>{lazyElement(RequireAuth)}</AdminAuthWrapper>,
      children: [
        {
          path: "/admin",
          element: lazyElement(AdminLayout),
          children: [
            { index: true, element: lazyElement(AdminDashboard) },
            { path: "analytics", element: lazyElement(AdminAnalytics) },
            { path: "orders", element: lazyElement(AdminOrders) },
            {
              path: "products",
              element: <Outlet />,
              children: [
                {
                  index: true,
                  element: lazyElement(AdminProducts),
                },
                {
                  path: "new",
                  element: lazyElement(AdminAddProducts),
                },
              ],
            },
            {
              path: "categories",
              element: <Outlet />,
              children: [
                { index: true, element: lazyElement(AdminCategories) },
                { path: "new", element: lazyElement(AdminAddCategory) },
              ],
            },
            { path: "customers", element: lazyElement(AdminCustomers) },
            { path: "reviews", element: lazyElement(AdminReviews) },
            { path: "coupons", element: lazyElement(AdminCoupons) },
            { path: "inventory", element: lazyElement(AdminInventory) },
            { path: "sales", element: lazyElement(AdminSales) },
            { path: "returns", element: lazyElement(AdminReturns) },
            { path: "payments", element: lazyElement(AdminPayments) },
            { path: "shipping", element: lazyElement(AdminShipping) },
            { path: "notifications", element: lazyElement(AdminNotifications) },
            { path: "cms", element: lazyElement(AdminCMS) },
            { path: "blog", element: lazyElement(AdminBlog) },
            { path: "media", element: lazyElement(AdminMedia) },
            {
              path: "email-templates",
              element: lazyElement(AdminEmailTemplates),
            },
            { path: "users", element: lazyElement(AdminUsers) },
            { path: "audit-logs", element: lazyElement(AdminAuditLogs) },
            { path: "system-health", element: lazyElement(AdminSystemHealth) },
            { path: "api-keys", element: lazyElement(AdminApiKeys) },
            { path: "integrations", element: lazyElement(AdminIntegrations) },
            { path: "feature-flags", element: lazyElement(AdminFeatureFlags) },
            { path: "backup", element: lazyElement(AdminBackup) },
            { path: "settings", element: lazyElement(AdminSettings) },
          ],
        },
      ],
    },
  ]);
}
