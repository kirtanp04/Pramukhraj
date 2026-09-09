import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PRODUCT_LISTING_PAGE_SIZE, PRODUCT_PRICE_CEILING, productStatusTitles } from '@/constants/productListing'
import { searchQueryParams } from '@/constants/searchQueryParams'
import { useCustomerCategories } from '@/hooks/useCustomerCategoriesContext'
import { filterAndSortProducts, parseProductSort, parseProductStatus } from '@/lib/productListing'
import { categories as categoryDetails, products } from '@/mock'
import type { ProductListingFilters, ProductListingView, ProductSortValue } from '@/types/productListing'

export function useProductListing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { categories } = useCustomerCategories()

  const search = searchParams.get(searchQueryParams.search) ?? ''
  const sort = parseProductSort(searchParams.get(searchQueryParams.sort))
  const status = parseProductStatus(searchParams.get(searchQueryParams.status))
  const categorySlug = searchParams.get(searchQueryParams.category) ?? undefined

  const [filters, setFilters] = useState<ProductListingFilters>({
    categorySlug,
    brandSlugs: [],
    maxPrice: PRODUCT_PRICE_CEILING,
  })
  const [view, setView] = useState<ProductListingView>('grid')
  const [page, setPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setFilters((current) => ({ ...current, categorySlug }))
    setPage(1)
  }, [categorySlug])

  useEffect(() => {
    setPage(1)
  }, [search, status])

  useEffect(() => {
    setIsLoading(true)
    const timer = window.setTimeout(() => setIsLoading(false), 350)
    return () => window.clearTimeout(timer)
  }, [filters, page, search, sort, status])

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, filters, { search, sort, status }),
    [filters, search, sort, status],
  )

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCT_LISTING_PAGE_SIZE))
  const pageProducts = filteredProducts.slice(
    (page - 1) * PRODUCT_LISTING_PAGE_SIZE,
    page * PRODUCT_LISTING_PAGE_SIZE,
  )

  const selectedCategory = categories.find((category) => category.slug === filters.categorySlug)
  const selectedCategoryDetails = categoryDetails.find((category) => category.slug === filters.categorySlug)
  const pageTitle = selectedCategory?.name
    ?? selectedCategoryDetails?.name
    ?? (search ? `Results for "${search}"` : status ? productStatusTitles[status] : 'All Products')

  function updateSort(nextSort: ProductSortValue) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set(searchQueryParams.sort, nextSort)
    setSearchParams(nextParams)
    setPage(1)
  }

  function updateFilters(nextFilters: ProductListingFilters) {
    setFilters(nextFilters)
    setPage(1)

    if (nextFilters.categorySlug === filters.categorySlug) return
    const nextParams = new URLSearchParams(searchParams)
    if (nextFilters.categorySlug) {
      nextParams.set(searchQueryParams.category, nextFilters.categorySlug)
    } else {
      nextParams.delete(searchQueryParams.category)
    }
    setSearchParams(nextParams)
  }

  return {
    filters,
    filteredProductCount: filteredProducts.length,
    isLoading,
    mobileFiltersOpen,
    page,
    pageProducts,
    pageTitle,
    selectedCategoryDescription: selectedCategoryDetails?.description,
    setMobileFiltersOpen,
    setPage,
    setView,
    sort,
    totalPages,
    updateFilters,
    updateSort,
    view,
  }
}
