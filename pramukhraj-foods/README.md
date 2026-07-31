# PramukhRaj Foods — E-Commerce Storefront (UI Only)

A premium, responsive e-commerce storefront for a fictional traditional Indian snacks & sweets
brand, built as a UI-only demo with mock data (no backend).

## Stack
React 19 · Vite · TypeScript · Tailwind CSS v4 · Zustand · React Router · Framer Motion ·
Radix UI primitives · Lucide Icons

## Getting started
```bash
npm install
npm run dev      # start local dev server
npm run build    # production build
```

## What's included in this phase
- **Home** — hero, category showcase, deals/trending/best-seller/new-arrival rails, testimonials,
  blog preview, FAQ
- **Product Listing / Category pages** — filters (category, brand, price, rating), sort, grid/list
  view, pagination, mobile filter drawer, instant search
- **Product Detail** — image gallery, tabs (description, ingredients, nutrition, reviews),
  related products
- **Cart** — drawer + full page, quantity control, coupon code (`WELCOME10`), order summary
- **Checkout** — address, delivery slot, payment method, order confirmation
- **Account** — dashboard, orders with tracking timeline, wishlist, addresses, wallet, and
  placeholder sections for notifications/returns/reviews/support/invoices/profile/security
- **Auth** — login, register, OTP login, forgot/reset password, verify email (UI only)
- **Track Order, Help Center, About, Blog** pages
- Light/dark theme toggle, ~90 mock products across 18 categories, persisted cart (localStorage)

## Admin Console (`/admin`)
A separate, role-based commerce console for managing the storefront, gated behind mock
authentication and permission checks.

**Sign in:** go to `/admin/login` (also linked from the storefront footer). Password for every
demo account is `admin123`; buttons on the login screen fill in each role for you.

| Role | Email | Access |
|---|---|---|
| Super Admin | superadmin@pramukhraj.com | Everything, including Roles & Permissions and system settings |
| Catalog Manager | catalog@pramukhraj.com | Products, categories, inventory, coupons |
| Order & Support Manager | support@pramukhraj.com | Orders, customers, returns, reviews |
| Content Editor | content@pramukhraj.com | Homepage CMS, blog, media library |
| Finance & Reports Viewer | finance@pramukhraj.com | Read-only — sales, analytics, payments |

**How the RBAC works** (see `src/store/authStore.ts`, `src/mock/roles.ts`,
`src/types/admin.ts`):
- Permissions are `resource.action` strings (e.g. `products.manage`); `resource.*` grants every
  action on a resource, and `*` grants everything (Super Admin).
- `RequireAuth` (`src/components/admin/RequireAuth.tsx`) redirects unauthenticated visitors to
  `/admin/login` and returns them to the page they wanted after signing in.
- `PermissionGate` (`src/components/admin/PermissionGate.tsx`) wraps every admin route; a signed-in
  user without the right permission sees an in-app "Access Restricted" message instead of the module.
- The sidebar (`src/constants/adminNav.ts` + `AdminLayout`) only renders links the current role can
  access, so navigation itself reflects each role's permissions.
- Every create/update/delete/status-change action calls `logAction()`, which appends an entry to
  the **Audit Logs** module — try switching roles and making a change to see it recorded.

**Modules included:** Dashboard (KPIs + charts), Analytics, Orders (with tracking timeline &
status updates), Products (full CRUD with a validated form), Categories & Brands, Customers
(block/unblock), Reviews (moderation), Coupons (CRUD), Inventory (stock adjustment), Sales
Reports, Returns & Refunds, Payments, Shipping, Notifications, Homepage CMS (hero content +
section visibility), Blog, Media Library, Email Templates, Roles & Permissions (editable matrix),
Admin Users (invite/suspend/role-assign), Audit Logs, System Health, API Keys, Integrations,
Feature Flags, Backups, and Settings.

The admin bundle is code-split (`React.lazy`) from the storefront, so shoppers never download
`recharts` or the data-table library.

## Design system
- Palette: warm ivory / oxblood / turmeric / deep teal (see `src/index.css` `@theme` block)
- Typography: Fraunces (display), Work Sans (body), IBM Plex Mono (prices, SKUs)
- Signature motif: a scalloped/perforated edge (`.scallop-top` / `.scallop-bottom` in
  `src/index.css`) echoing the die-cut flap of a namkeen packet — used on product cards,
  dividers, and empty states
- The admin console reuses the same tokens, with a deep-teal "console" shell to visually separate
  it from the consumer storefront

## Not yet built (next phase)
The remaining ~110 products to reach the 200+ target, warehouse/supplier/purchase-order
modules, and notification-template previews are still light placeholders or omitted. Ask and
I'll extend this project.

## Folder structure
```
src/
  app/            # (reserved for app-level providers)
  components/
    ui/           # Button, Badge, Rating, Skeleton, QuantityStepper...
    layout/       # Header, Footer, Logo, SearchBar, AccountLayout, StorefrontLayout
    storefront/   # ProductCard, ProductRail, Hero, CartDrawer, Testimonials...
  pages/          # route-level pages (+ account/, auth/ subfolders)
  mock/           # categories, brands, generated products, orders
  services/       # mock async "API" layer (services/catalogService.ts)
  store/          # zustand stores (cart, theme)
  types/          # shared TypeScript types
  lib/            # cn(), formatINR(), slugify()
```
