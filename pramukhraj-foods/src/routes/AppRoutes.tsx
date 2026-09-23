import { Navigate, Outlet, useRoutes } from "react-router-dom";
import { LazyRoute } from "@/routes/RouteLoader";
import { lazyNamed } from "@/routes/lazyNamed";
import AdminAuthWrapper from "@/components/admin/AdminAuthWrapper";
import { AuthEntryRedirect } from "@/features/customer-auth/components/AuthEntryRedirect";
import { RequireCustomerAuth } from "@/features/customer-auth/components/RequireCustomerAuth";
import { CustomerVerifiedRoute } from "@/features/customer-verification/components/CustomerVerifiedRoute";

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
  () => import("@/pages/product-listing/ProductListingPage"),
  "ProductListingPage"
);
const ProductDetail = lazyNamed(
  () => import("@/pages/ProductDetail"),
  "ProductDetail"
);
const Cart = lazyNamed(() => import("@/pages/Cart"), "Cart");
const Checkout = lazyNamed(() => import("@/features/checkout/pages/CheckoutPage"), "CheckoutPage");
const CustomerVerification = lazyNamed(() => import("@/features/customer-verification/pages/CustomerVerificationPage"), "CustomerVerificationPage");
const OrderConfirmation = lazyNamed(
  () => import("@/pages/OrderConfirmation"),
  "OrderConfirmation"
);
const TrackOrder = lazyNamed(() => import("@/pages/TrackOrder"), "TrackOrder");
const Help = lazyNamed(() => import("@/pages/Help"), "Help");
const About = lazyNamed(() => import("@/pages/About"), "About");
const NotFound = lazyNamed(() => import("@/pages/NotFound"), "NotFound");
const AccountDashboard = lazyNamed(
  () => import("@/pages/account/AccountDashboard"),
  "AccountDashboard"
);
const AccountOrders = lazyNamed(
  () => import("@/pages/account/AccountOrders"),
  "AccountOrders"
);
const CustomerOrderDetailPage = lazyNamed(
  () => import("@/features/orders/pages/CustomerOrderDetailPage"),
  "CustomerOrderDetailPage"
);
const AccountAddresses = lazyNamed(
  () => import("@/features/customer-addresses/pages/CustomerAddressesPage"),
  "CustomerAddressesPage"
);
const AccountNotifications = lazyNamed(
  () => import("@/pages/account/AccountNotifications"),
  "AccountNotifications"
);
const AccountReturns = lazyNamed(
  () => import("@/pages/account/AccountReturns"),
  "AccountReturns"
);
const AccountReviews = lazyNamed(
  () => import("@/pages/account/AccountReviews"),
  "AccountReviews"
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
const AdminAnalytics = lazyNamed(
  () => import("@/pages/admin/AdminAnalytics"),
  "AdminAnalytics"
);
const AdminCacheMetrics = lazyNamed(
  () => import("@/pages/admin/cache-metrics/AdminCacheMetrics"),
  "AdminCacheMetrics"
);
const AdminOrders = lazyNamed(
  () => import("@/pages/admin/order/AdminOrders"),
  "AdminOrders"
);
const AdminOrderDetailPage = lazyNamed(
  () => import("@/pages/admin/order/AdminOrderDetailPage"),
  "AdminOrderDetailPage"
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
  () => import("@/pages/admin/review/AdminReviews"),
  "AdminReviews"
);
const AdminReviewForm = lazyNamed(
  () => import("@/pages/admin/review/AdminReviewFormPage"),
  "AdminReviewFormPage"
);
const FaqList = lazyNamed(
  () => import("@/pages/admin/faq/FaqList"),
  "FaqList"
);
const FaqFormPage = lazyNamed(
  () => import("@/pages/admin/faq/FaqFormPage"),
  "FaqFormPage"
);
const CouponList = lazyNamed(
  () => import("@/pages/admin/coupon/CouponList"),
  "CouponList"
);
const CouponFormPage = lazyNamed(
  () => import("@/pages/admin/coupon/CouponFormPage"),
  "CouponFormPage"
);
const AdminInventory = lazyNamed(
  () => import("@/pages/admin/inventory/AdminInventory"),
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
  () => import("@/pages/admin/payment/AdminPayments"),
  "AdminPayments"
);
const AdminPaymentDetailPage = lazyNamed(
  () => import("@/pages/admin/payment/AdminPaymentDetailPage"),
  "AdminPaymentDetailPage"
);
const AdminShipments = lazyNamed(
  () => import("@/pages/admin/shipping/AdminShipments"),
  "AdminShipments"
);
const AdminShipmentDetailPage = lazyNamed(
  () => import("@/pages/admin/shipping/AdminShipmentDetailPage"),
  "AdminShipmentDetailPage"
);
const AdminNotifications = lazyNamed(
  () => import("@/pages/admin/AdminNotifications"),
  "AdminNotifications"
);
const AdminCMS = lazyNamed(() => import("@/pages/admin/AdminCMS"), "AdminCMS");
const TwilioCredentialsPage = lazyNamed(
  () => import("@/pages/admin/provider-credentials/TwilioCredentialsPage"),
  "TwilioCredentialsPage"
);
const RazorpayCredentialsPage = lazyNamed(
  () => import("@/pages/admin/provider-credentials/RazorpayCredentialsPage"),
  "RazorpayCredentialsPage"
);
const ShiprocketCredentialsPage = lazyNamed(
  () => import("@/pages/admin/provider-credentials/ShiprocketCredentialsPage"),
  "ShiprocketCredentialsPage"
);
const SmtpCredentialsPage = lazyNamed(
  () => import("@/pages/admin/provider-credentials/SmtpCredentialsPage"),
  "SmtpCredentialsPage"
);
const AdminEmailTemplates = lazyNamed(
  () => import("@/pages/admin/AdminEmailTemplates"),
  "AdminEmailTemplates"
);
const EmailTemplateFormPage = lazyNamed(
  () => import("@/pages/admin/email-templates/EmailTemplateFormPage"),
  "EmailTemplateFormPage"
);
const AdminUsers = lazyNamed(
  () => import("@/pages/admin/AdminUsers"),
  "AdminUsers"
);
const AdminActions = lazyNamed(
  () => import("@/pages/admin/admin-action/AdminActions"),
  "AdminActions"
);
const AdminLogs = lazyNamed(
  () => import("@/pages/admin/logs/AdminLogsPage"),
  "AdminLogsPage"
);
const AdminBackgroundMetrics = lazyNamed(
  () => import("@/pages/admin/background-metrics/AdminBackgroundMetrics"),
  "AdminBackgroundMetrics"
);
const AdminServerMetrics = lazyNamed(
  () => import("@/pages/admin/server-metrics/AdminServerMetrics"),
  "AdminServerMetrics"
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
        { path: "/product/:slug", element: lazyElement(ProductDetail) },
        { path: "/cart", element: lazyElement(Cart) },
        { path: "/checkout", element: <RequireCustomerAuth><CustomerVerifiedRoute>{lazyElement(Checkout)}</CustomerVerifiedRoute></RequireCustomerAuth> },
        { path: "/verify-checkout", element: <RequireCustomerAuth>{lazyElement(CustomerVerification)}</RequireCustomerAuth> },
        {
          path: "/order-confirmation",
          element: lazyElement(OrderConfirmation),
        },
        { path: "/track-order", element: lazyElement(TrackOrder) },
        { path: "/help", element: lazyElement(Help) },
        { path: "/about", element: lazyElement(About) },
        { path: "/login", element: <AuthEntryRedirect /> },
        { path: "/register", element: <AuthEntryRedirect /> },
        { path: "/otp-login", element: <AuthEntryRedirect /> },
        { path: "/forgot-password", element: <AuthEntryRedirect /> },
        { path: "/reset-password", element: <AuthEntryRedirect /> },
        { path: "/verify-email", element: <AuthEntryRedirect /> },
        {
          path: "/account",
          element: <RequireCustomerAuth>{lazyElement(AccountLayout)}</RequireCustomerAuth>,
          children: [
            { index: true, element: lazyElement(AccountDashboard) },
            { path: "orders", element: lazyElement(AccountOrders) },
            { path: "orders/:orderId", element: lazyElement(CustomerOrderDetailPage) },
            { path: "addresses", element: lazyElement(AccountAddresses) },
            {
              path: "notifications",
              element: lazyElement(AccountNotifications),
            },
            { path: "returns", element: lazyElement(AccountReturns) },
            { path: "reviews", element: lazyElement(AccountReviews) },
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
            { index: true, element: <Navigate to="/admin/orders" replace /> },
            { path: "analytics", element: lazyElement(AdminAnalytics) },
            { path: "cache-metrics", element: lazyElement(AdminCacheMetrics) },
            { path: "orders", element: lazyElement(AdminOrders) },
            { path: "orders/:orderId", element: lazyElement(AdminOrderDetailPage) },
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
                {
                  path: ":id/edit",
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
                { path: ":id/edit", element: lazyElement(AdminAddCategory) },
              ],
            },
            { path: "customers", element: lazyElement(AdminCustomers) },
            {
              path: "reviews",
              element: <Outlet />,
              children: [
                { index: true, element: lazyElement(AdminReviews) },
                { path: "new", element: lazyElement(AdminReviewForm) },
                { path: ":id/edit", element: lazyElement(AdminReviewForm) },
              ],
            },
            {
              path: "coupons",
              element: <Outlet />,
              children: [
                { index: true, element: lazyElement(CouponList) },
                { path: "new", element: lazyElement(CouponFormPage) },
                { path: ":id/edit", element: lazyElement(CouponFormPage) },
              ],
            },
            {
              path: "faqs",
              element: <Outlet />,
              children: [
                { index: true, element: lazyElement(FaqList) },
                { path: "new", element: lazyElement(FaqFormPage) },
                { path: ":id/edit", element: lazyElement(FaqFormPage) },
              ],
            },
            { path: "inventory", element: lazyElement(AdminInventory) },
            { path: "sales", element: lazyElement(AdminSales) },
            { path: "returns", element: lazyElement(AdminReturns) },
            { path: "payments", element: lazyElement(AdminPayments) },
            { path: "payments/:paymentId", element: lazyElement(AdminPaymentDetailPage) },
            { path: "shipping", element: lazyElement(AdminShipments) },
            { path: "shipping/:shipmentId", element: lazyElement(AdminShipmentDetailPage) },
            { path: "notifications", element: lazyElement(AdminNotifications) },
            { path: "cms", element: lazyElement(AdminCMS) },
            { path: "provider-credentials/twilio", element: lazyElement(TwilioCredentialsPage) },
            { path: "provider-credentials/razorpay", element: lazyElement(RazorpayCredentialsPage) },
            { path: "provider-credentials/shiprocket", element: lazyElement(ShiprocketCredentialsPage) },
            { path: "provider-credentials/smtp", element: lazyElement(SmtpCredentialsPage) },
            {
              path: "email-templates",
              element: <Outlet />,
              children: [
                { index: true, element: lazyElement(AdminEmailTemplates) },
                { path: "new", element: lazyElement(EmailTemplateFormPage) },
                { path: ":id/edit", element: lazyElement(EmailTemplateFormPage) },
              ],
            },
            { path: "users", element: lazyElement(AdminUsers) },
            { path: "admin-actions", element: lazyElement(AdminActions) },
            { path: "audit-logs", element: lazyElement(AdminActions) },
            { path: "logs", element: lazyElement(AdminLogs) },
            { path: "background-metrics", element: lazyElement(AdminBackgroundMetrics) },
            { path: "server-metrics", element: lazyElement(AdminServerMetrics) },
            { path: "settings", element: lazyElement(AdminSettings) },
          ],
        },
      ],
    },
  ]);
}
