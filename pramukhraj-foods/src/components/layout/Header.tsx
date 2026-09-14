import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Menu, X, ChevronDown, UserRound } from "lucide-react";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCustomerCategories } from "@/hooks/useCustomerCategoriesContext";
import { useCartStore } from "@/store/cartStore";
import { cn } from "@/lib/utils";
import {
  productsByCategoryUrl,
  productsByStatusUrl,
  productStatuses,
} from "@/constants/searchQueryParams";
import { useCustomerAuthStore } from "@/features/customer-auth/store/customerAuthStore";

export function Header() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lines = useCartStore(s => s.lines);
  const wishlist = useCartStore(s => s.wishlist);
  const openCart = useCartStore(s => s.openCart);
  const customer = useCustomerAuthStore(s => s.customer);
  const isCustomerAuthenticated = useCustomerAuthStore(s => s.isAuthenticated);
  const openCustomerAuth = useCustomerAuthStore(s => s.openAuth);
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    loadImages: loadCategoryImages,
  } = useCustomerCategories();

  useEffect(() => {
    if (megaOpen || mobileOpen) void loadCategoryImages();
  }, [loadCategoryImages, megaOpen, mobileOpen]);

  const cartCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-ivory/90 backdrop-blur-md">
      {/* Utility bar */}
      <div className="hidden bg-teal text-ivory md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              {" "}
              Authentic Taste of Gujarat
            </span>
            <span className="flex items-center gap-1">•</span>
            {/* <span className="flex items-center gap-1"><MapPin size={12} /> Deliver to Ahmedabad, 380001</span> */}
            <span className="flex items-center gap-1">Freshly Packed</span>
            <span className="flex items-center gap-1">•</span>
            {/* <span className="flex items-center gap-1"><Truck size={12} /> Free shipping over ₹499</span> */}
            <span className="flex items-center gap-1">
              Delivered to Your Doorstep
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/track-order" className="hover:text-amber-300">
              Track Order
            </Link>
            <span className="flex items-center gap-1">•</span>
            <Link to="/help" className="hover:text-amber-300">
              Help
            </Link>
            {/* <button className="hover:text-turmeric">EN</button> */}
            {/* <button className="hover:text-turmeric">INR ₹</button> */}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
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
          <Link
            to="/account/wishlist"
            aria-label="Wishlist"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-ink/5"
          >
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
          {isCustomerAuthenticated ? (
            <Link to="/account" className="hidden h-9 items-center gap-1.5 rounded-full border border-ink/15 px-3 text-sm hover:bg-ink/5 sm:flex">
              <UserRound size={15} /> {customer?.fullName?.split(" ")[0] || "Account"}
            </Link>
          ) : (
            <button onClick={openCustomerAuth} className="hidden h-9 items-center gap-1.5 rounded-full border border-ink/15 px-3 text-sm hover:bg-ink/5 sm:flex">
              <UserRound size={15} /> Sign in
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <SearchBar />
      </div>

      {/* Category nav / mega menu */}
      <nav
        className="hidden border-t border-ink/10 md:block"
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-2.5 text-sm">
          <button
            onMouseEnter={() => setMegaOpen(true)}
            className="flex items-center gap-1 font-medium text-oxblood"
          >
            All Categories{" "}
            <ChevronDown
              size={14}
              className={cn("transition-transform", megaOpen && "rotate-180")}
            />
          </button>
          <Link
            to={productsByStatusUrl(productStatuses.newArrivals)}
            className="text-ink-soft hover:text-ink"
          >
            New Arrivals
          </Link>
          <Link
            to={productsByStatusUrl(productStatuses.bestSellers)}
            className="text-ink-soft hover:text-ink"
          >
            Best Seller
          </Link>
          <Link
            to={productsByStatusUrl(productStatuses.trending)}
            className="text-ink-soft hover:text-ink"
          >
            Trending
          </Link>
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
                {categoriesLoading ? (
                  Array.from({ length: 6 }, (_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-1.5"
                      aria-hidden="true"
                    >
                      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))
                ) : categories.length > 0 ? (
                  categories.map(c => (
                    <Link
                      key={c.id}
                      to={productsByCategoryUrl(c.slug)}
                      onClick={() => setMegaOpen(false)}
                      className="group flex items-center gap-3 rounded-lg p-1.5 hover:bg-tan/50"
                    >
                      {c.image ? (
                        <img
                          src={c.image}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-tan font-medium text-ink-soft"
                          aria-hidden="true"
                        >
                          {c.name.charAt(0)}
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-medium group-hover:text-oxblood">
                          {c.name}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {c.productCount} items
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="col-span-full py-4 text-center text-sm text-ink-soft">
                    {categoriesError
                      ? "Categories are temporarily unavailable."
                      : "No categories are available yet."}
                  </p>
                )}
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
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[82%] max-w-xs overflow-y-auto bg-ivory p-5 md:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <Logo />
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-soft">
                Categories
              </p>
              <ul className="space-y-1">
                {categoriesLoading ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3 px-2 py-2"
                      aria-hidden="true"
                    >
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </li>
                  ))
                ) : categories.length > 0 ? (
                  categories.map(c => (
                    <li key={c.id}>
                      <Link
                        to={productsByCategoryUrl(c.slug)}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-tan/50"
                      >
                        {c.image ? (
                          <img
                            src={c.image}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-tan text-sm font-medium text-ink-soft"
                            aria-hidden="true"
                          >
                            {c.name.charAt(0)}
                          </span>
                        )}
                        <span className="text-sm">{c.name}</span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="px-2 py-3 text-sm text-ink-soft">
                    {categoriesError
                      ? "Categories are temporarily unavailable."
                      : "No categories are available yet."}
                  </li>
                )}
              </ul>
              {isCustomerAuthenticated ? (
                <Link to="/account" onClick={() => setMobileOpen(false)} className="mt-6 flex h-11 items-center justify-center gap-2 rounded-full border border-ink/15 text-sm font-medium"><UserRound size={16} /> My account</Link>
              ) : (
                <button onClick={() => { setMobileOpen(false); openCustomerAuth(); }} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-oxblood text-sm font-medium text-ivory"><UserRound size={16} /> Sign in with mobile</button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
