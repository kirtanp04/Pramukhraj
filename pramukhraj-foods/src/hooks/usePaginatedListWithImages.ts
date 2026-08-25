import { useCallback, useEffect, useRef, useState } from 'react'
import { getApiErrorMessage } from '@/lib/apiClient'
import type { PaginationMetadata } from '@/types/common'

interface RequestState<T> {
  data: T
  isLoading: boolean
  error: string | null
}

interface PaginatedListWithImagesOptions<TItem, TImage> {
  page: number
  pageSize: number
  getItemId: (item: TItem) => string
  fetchPage: (page: number, signal: AbortSignal) => Promise<TItem[] | null>
  fetchImages: (ids: string[], signal: AbortSignal) => Promise<Record<string, TImage> | null>
}

function normalizeDictionary<TImage>(
  dictionary: Record<string, TImage> | null,
): Record<string, TImage> {
  if (!dictionary) return {}

  const normalized: Record<string, TImage> = {}
  Object.entries(dictionary).forEach(([id, image]) => {
    normalized[id.toLowerCase()] = image
  })
  return normalized
}

export function usePaginatedListWithImages<TItem, TImage>({
  page,
  pageSize,
  getItemId,
  fetchPage,
  fetchImages,
}: PaginatedListWithImagesOptions<TItem, TImage>) {
  const [listState, setListState] = useState<RequestState<TItem[]>>({
    data: [],
    isLoading: true,
    error: null,
  })
  const [imagesState, setImagesState] = useState<RequestState<Record<string, TImage>>>({
    data: {},
    isLoading: false,
    error: null,
  })
  const activeRequest = useRef<AbortController | null>(null)

  const loadPage = useCallback(async () => {
    activeRequest.current?.abort()

    const controller = new AbortController()
    activeRequest.current = controller
    setListState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const items = (await fetchPage(page, controller.signal)) ?? []
      if (controller.signal.aborted) return

      setListState({ data: items, isLoading: false, error: null })

      const itemIds = Array.from(new Set(
        items
          .map((item) => getItemId(item).trim())
          .filter((id) => id.length > 0),
      ))

      setImagesState({ data: {}, isLoading: itemIds.length > 0, error: null })
      if (itemIds.length === 0) return

      try {
        const images = await fetchImages(itemIds, controller.signal)
        if (controller.signal.aborted) return

        setImagesState({
          data: normalizeDictionary(images),
          isLoading: false,
          error: null,
        })
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        setImagesState({ data: {}, isLoading: false, error: getApiErrorMessage(error) })
      }
    } catch (error: unknown) {
      if (controller.signal.aborted) return
      setListState({ data: [], isLoading: false, error: getApiErrorMessage(error) })
      setImagesState({ data: {}, isLoading: false, error: null })
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null
    }
  }, [fetchImages, fetchPage, getItemId, page])

  useEffect(() => {
    const requestTimer = window.setTimeout(() => void loadPage(), 0)
    return () => {
      window.clearTimeout(requestTimer)
      activeRequest.current?.abort()
    }
  }, [loadPage])

  const updateItem = useCallback((id: string, update: (item: TItem) => TItem) => {
    setListState((current) => ({
      ...current,
      data: current.data.map((item) => getItemId(item) === id ? update(item) : item),
    }))
  }, [getItemId])

  const removeItem = useCallback((id: string) => {
    setListState((current) => ({
      ...current,
      data: current.data.filter((item) => getItemId(item) !== id),
    }))
  }, [getItemId])

  const pagination: PaginationMetadata = {
    page,
    pageSize,
    hasPreviousPage: page > 1,
    hasNextPage: listState.data.length === pageSize,
  }

  return {
    items: listState.data,
    images: imagesState.data,
    pagination,
    isInitialLoading: listState.isLoading && listState.data.length === 0,
    isPageFetching: listState.isLoading && listState.data.length > 0,
    listError: listState.error,
    imagesLoading: imagesState.isLoading,
    imagesError: imagesState.error,
    retry: loadPage,
    updateItem,
    removeItem,
  }
}
