import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Hero } from "@/components/storefront/Hero";
import { ProductRail } from "@/components/storefront/ProductRail";
import { CategoryCard } from "@/components/storefront/CategoryCard";
import { Testimonials } from "@/components/storefront/Testimonials";
import { FAQSection } from "@/components/storefront/FAQSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCustomerCategories } from "@/hooks/useCustomerCategoriesContext";
import {
  productsByStatusUrl,
  productStatuses,
} from "@/constants/searchQueryParams";
import { useCustomerHomeProducts } from "@/hooks/useCustomerHomeProducts";
import { useCustomerHomepageHero } from "@/hooks/homepage-cms/useCustomerHomepageHero";

export function Home() {
  const { hero, isLoading: heroLoading, error: heroError } = useCustomerHomepageHero();
  const {
    groups,
    isLoading: productsLoading,
    error: productsError,
    retry: retryProducts,
  } = useCustomerHomeProducts();
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    loadImages: loadCategoryImages,
  } = useCustomerCategories();

  useEffect(() => {
    if (!categoriesLoading && categories.length > 0) void loadCategoryImages();
  }, [categories, categoriesLoading, loadCategoryImages]);

  return (
    <>
      <div aria-busy={heroLoading}>
        <Hero
          badge={hero?.eyebrowBadge}
          headline={hero?.headline}
          subtext={hero?.subtext}
          imageSrc={hero?.heroImageBase64 || undefined}
          imageAlt={hero?.heroImageAltText}
          happyCustomersCount={hero?.happyCustomersCount}
          happyCustomersLabel={hero?.happyCustomersLabel}
          productCount={hero?.productCount}
          productCountLabel={hero?.productCountLabel}
          averageRating={hero?.averageRating}
          averageRatingLabel={hero?.averageRatingLabel}
        />
        {heroError && <span className="sr-only" role="status">Homepage content could not be refreshed. Default content is shown.</span>}
      </div>

      {!categoriesError && <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl sm:text-3xl">
            Shop by Category
          </h2>
          <Link
            to="/products"
            className="hidden text-sm font-medium text-oxblood hover:underline sm:block"
          >
            Browse all
          </Link>
        </div>
        {categoriesLoading ? (
          <div
            className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9"
            aria-label="Loading categories"
          >
            {Array.from({ length: 9 }, (_, index) => (
              <div key={index} className="flex flex-col items-center gap-3 p-3">
                <Skeleton className="h-20 w-20 rounded-full sm:h-24 sm:w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9">
            {categories.map(category => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-tan/30 px-6 py-10 text-center">
            <p className="font-medium">No categories are available yet.</p>
            <p className="mt-1 text-sm text-ink-soft">Please check back soon.</p>
          </div>
        ) : null}
      </section>}

      {productsError && !productsLoading ? (
        <section className="mx-auto max-w-7xl px-4 py-10 text-center md:px-6">
          <div className="rounded-2xl border border-ink/10 bg-tan/30 px-6 py-10">
            <p className="font-medium">Products could not be loaded.</p>
            <p className="mt-1 text-sm text-ink-soft">{productsError}</p>
            <button
              type="button"
              onClick={() => void retryProducts()}
              className="mt-4 rounded-full bg-oxblood px-4 py-2 text-sm font-medium text-ivory hover:bg-oxblood/90"
            >
              Try again
            </button>
          </div>
        </section>
      ) : (
        <>
          <ProductRail
            title="Featured Products"
            eyebrow="Handpicked for you"
            products={groups.featured}
            viewAllHref={productsByStatusUrl(productStatuses.featured)}
            loading={productsLoading}
          />
          <ProductRail
            title="Best Sellers"
            eyebrow="Customer favourites"
            products={groups.bestSellers}
            viewAllHref={productsByStatusUrl(productStatuses.bestSellers)}
            loading={productsLoading}
          />
          <ProductRail
            title="New Arrivals"
            eyebrow="Just landed"
            products={groups.newArrivals}
            viewAllHref={productsByStatusUrl(productStatuses.newArrivals)}
            loading={productsLoading}
          />
          <ProductRail
            title="Trending Now"
            eyebrow="Popular this week"
            products={groups.trending}
            viewAllHref={productsByStatusUrl(productStatuses.trending)}
            loading={productsLoading}
          />
        </>
      )}

      <Testimonials />
      <FAQSection />
    </>
  );
}
