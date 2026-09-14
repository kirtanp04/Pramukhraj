import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PRODUCT_LISTING_PAGE_SIZE, PRODUCT_PRICE_CEILING, productStatusTitles } from '@/constants/productListing'
import { searchQueryParams } from '@/constants/searchQueryParams'
import { useCustomerCategories } from '@/hooks/useCustomerCategoriesContext'
import { getApiErrorMessage } from '@/lib/apiClient'
import { toCatalogListProduct } from '@/lib/customerProductListMappings'
import {
  parseProductCategorySlug,
  parseProductMaxPrice,
  parseProductPage,
  parseProductSearch,
  parseProductSort,
  parseProductStatus,
  toCustomerProductSort,
  toCustomerProductStatus,
} from '@/lib/productListing'
import { customerProductApi } from '@/services/customerProductApi'
import type { Product } from '@/types/catalog'
import type { CustomerProductListRequest } from '@/types/customerProduct'
import type { ProductListingFilters, ProductListingView, ProductSortValue } from '@/types/productListing'

const requestDebounceMilliseconds = 200

export function useProductListing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { categories, isLoading: categoriesLoading } = useCustomerCategories()

  const search = parseProductSearch(searchParams.get(searchQueryParams.search))
  const sort = parseProductSort(searchParams.get(searchQueryParams.sort))
  const status = parseProductStatus(searchParams.get(searchQueryParams.status))
  const categorySlug = parseProductCategorySlug(searchParams.get(searchQueryParams.category))
  const maxPrice = parseProductMaxPrice(searchParams.get(searchQueryParams.maxPrice))
  const page = parseProductPage(searchParams.get(searchQueryParams.page))

  const filters = useMemo<ProductListingFilters>(
    () => ({ categorySlug, maxPrice }),
    [categorySlug, maxPrice],
  )
  const selectedCategory = categories.find((category) => category.slug === categorySlug)

  const [products, setProducts] = useState<Product[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)
  const [view, setView] = useState<ProductListingView>('grid')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const activeRequest = useRef<AbortController | null>(null)

  useEffect(() => {
    const normalizedParams = new URLSearchParams(searchParams)

    setOptionalParam(normalizedParams, searchQueryParams.search, search || undefined)
    setOptionalParam(normalizedParams, searchQueryParams.category, categorySlug)
    setOptionalParam(normalizedParams, searchQueryParams.status, status)
    setOptionalParam(
      normalizedParams,
      searchQueryParams.sort,
      sort === 'price-desc' ? sort : undefined,
    )
    setOptionalParam(
      normalizedParams,
      searchQueryParams.maxPrice,
      maxPrice === PRODUCT_PRICE_CEILING ? undefined : String(maxPrice),
    )
    setOptionalParam(
      normalizedParams,
      searchQueryParams.page,
      page === 1 ? undefined : String(page),
    )

    if (!categoriesLoading && categorySlug && !selectedCategory) {
      normalizedParams.delete(searchQueryParams.category)
      normalizedParams.delete(searchQueryParams.page)
    }

    if (normalizedParams.toString() !== searchParams.toString()) {
      setSearchParams(normalizedParams, { replace: true })
    }
  }, [
    categoriesLoading,
    categorySlug,
    maxPrice,
    page,
    search,
    searchParams,
    selectedCategory,
    setSearchParams,
    sort,
    status,
  ])

  useEffect(() => {
    if (categoriesLoading || (categorySlug && !selectedCategory)) return

    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setIsLoading(true)
    setError(null)

    const request: CustomerProductListRequest = {
      categoryId: selectedCategory?.id,
      search: search || undefined,
      page,
      pageSize: PRODUCT_LISTING_PAGE_SIZE,
      maxPrice,
      sortBy: toCustomerProductSort(sort),
      productStatus: toCustomerProductStatus(status),
    }

    const timer = window.setTimeout(() => {
      void customerProductApi.getList(request, controller.signal)
        .then((response) => {
          if (controller.signal.aborted) return
          if (!response || !Array.isArray(response.products)) {
            throw new Error('The server returned an invalid product list.')
          }

          const responseTotal = Number.isSafeInteger(response.totalCount) && response.totalCount >= 0
            ? response.totalCount
            : 0
          setProducts(response.products.map(toCatalogListProduct))
          setTotalCount(responseTotal)
        })
        .catch((requestError: unknown) => {
          if (controller.signal.aborted) return
          setProducts([])
          setTotalCount(0)
          setError(getApiErrorMessage(requestError))
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false)
          if (activeRequest.current === controller) activeRequest.current = null
        })
    }, requestDebounceMilliseconds)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [
    categoriesLoading,
    categorySlug,
    maxPrice,
    page,
    retryVersion,
    search,
    selectedCategory,
    sort,
    status,
  ])

  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCT_LISTING_PAGE_SIZE))

  useEffect(() => {
    if (isLoading || page <= totalPages) return
    const nextParams = new URLSearchParams(searchParams)
    setOptionalParam(
      nextParams,
      searchQueryParams.page,
      totalPages === 1 ? undefined : String(totalPages),
    )
    setSearchParams(nextParams, { replace: true })
  }, [isLoading, page, searchParams, setSearchParams, totalPages])

  const updateSort = useCallback((nextSort: ProductSortValue) => {
    const nextParams = new URLSearchParams(searchParams)
    setOptionalParam(
      nextParams,
      searchQueryParams.sort,
      nextSort === 'price-desc' ? nextSort : undefined,
    )
    nextParams.delete(searchQueryParams.page)
    setSearchParams(nextParams)
  }, [searchParams, setSearchParams])

  const updateFilters = useCallback((nextFilters: ProductListingFilters) => {
    const nextParams = new URLSearchParams(searchParams)
    setOptionalParam(nextParams, searchQueryParams.category, nextFilters.categorySlug)
    if (nextFilters.categorySlug) {
      nextParams.delete(searchQueryParams.status)
    }
    setOptionalParam(
      nextParams,
      searchQueryParams.maxPrice,
      nextFilters.maxPrice === PRODUCT_PRICE_CEILING
        ? undefined
        : String(Math.min(PRODUCT_PRICE_CEILING, Math.max(0, Math.round(nextFilters.maxPrice)))),
    )
    nextParams.delete(searchQueryParams.page)
    setSearchParams(nextParams)
  }, [searchParams, setSearchParams])

  const clearFilters = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete(searchQueryParams.category)
    nextParams.delete(searchQueryParams.maxPrice)
    nextParams.delete(searchQueryParams.page)
    setSearchParams(nextParams)
  }, [searchParams, setSearchParams])

  const setPage = useCallback((nextPage: number) => {
    if (!Number.isSafeInteger(nextPage) || nextPage < 1 || nextPage > totalPages || nextPage === page) return
    const nextParams = new URLSearchParams(searchParams)
    setOptionalParam(
      nextParams,
      searchQueryParams.page,
      nextPage === 1 ? undefined : String(nextPage),
    )
    setSearchParams(nextParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page, searchParams, setSearchParams, totalPages])

  const pageTitle = selectedCategory?.name
    ?? (search ? `Results for "${search}"` : status ? productStatusTitles[status] : 'All Products')

  return {
    clearFilters,
    error,
    filteredProductCount: totalCount,
    filters,
    isLoading,
    mobileFiltersOpen,
    page,
    pageProducts: products,
    pageTitle,
    retry: () => setRetryVersion((current) => current + 1),
    selectedCategoryDescription: undefined,
    setMobileFiltersOpen,
    setPage,
    setView,
    sort,
    status,
    totalPages,
    updateFilters,
    updateSort,
    view,
  }
}

function setOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
) {
  if (value === undefined || value === '') {
    params.delete(key)
  } else {
    params.set(key, value)
  }
}
