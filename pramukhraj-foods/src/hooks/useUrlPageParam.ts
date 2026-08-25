import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchQueryParams } from '@/constants/searchQueryParams'
import { getPositiveIntegerQueryParam } from '@/lib/queryParams'

export function useUrlPageParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawPage = searchParams.get(searchQueryParams.page)
  const page = getPositiveIntegerQueryParam(searchParams, searchQueryParams.page)

  useEffect(() => {
    if (rawPage === String(page)) return

    const normalizedParams = new URLSearchParams(searchParams)
    normalizedParams.set(searchQueryParams.page, String(page))
    setSearchParams(normalizedParams, { replace: true })
  }, [page, rawPage, searchParams, setSearchParams])

  const setPage = useCallback((nextPage: number) => {
    if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage === page) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set(searchQueryParams.page, String(nextPage))
    setSearchParams(nextParams)
  }, [page, searchParams, setSearchParams])

  return { page, setPage }
}
