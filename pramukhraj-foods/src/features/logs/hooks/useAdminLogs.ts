import { useCallback, useEffect, useRef, useState } from 'react'
import { adminLogsApi } from '../api/logs.api'
import type {
  AdminLogEntry,
  AdminLogFileInfo,
  LogLevelFilter,
  LogSubModule,
} from '../types/logs.types'
import { getApiErrorMessage } from '@/lib/apiClient'

export function useAdminLogs() {
  const [subModule, setSubModule] = useState<LogSubModule>('all')
  const [date, setDate] = useState<string>('')
  const [level, setLevel] = useState<LogLevelFilter>('all')
  const [search, setSearch] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')

  const [entries, setEntries] = useState<AdminLogEntry[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [totalFileSizeBytes, setTotalFileSizeBytes] = useState<number>(0)
  const [availableDates, setAvailableDates] = useState<AdminLogFileInfo[]>([])

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false)
  const [isClearing, setIsClearing] = useState<boolean>(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch initial chunk when subModule, date, level, or debouncedSearch changes
  const fetchInitialChunk = useCallback(async () => {
    setIsInitialLoading(true)
    setError(null)

    try {
      const response = await adminLogsApi.getChunk({
        subModule,
        date: date || undefined,
        cursor: null,
        limit: 50,
        level,
        search: debouncedSearch || undefined,
      })

      if (response) {
        setEntries(response.entries)
        setNextCursor(response.nextCursor)
        setHasMore(response.hasMore)
        setTotalFileSizeBytes(response.totalFileSizeBytes)
        setAvailableDates(response.availableDates)
        if (!date && response.date) {
          setDate(response.date)
        }
      } else {
        setEntries([])
        setNextCursor(null)
        setHasMore(false)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsInitialLoading(false)
    }
  }, [subModule, date, level, debouncedSearch])

  // Load initial chunk on filter changes
  useEffect(() => {
    void fetchInitialChunk()
  }, [fetchInitialChunk])

  // Load next chunk on scroll (infinite scroll)
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore || isInitialLoading) {
      return
    }

    setIsLoadingMore(true)
    try {
      const response = await adminLogsApi.getChunk({
        subModule,
        date: date || undefined,
        cursor: nextCursor,
        limit: 50,
        level,
        search: debouncedSearch || undefined,
      })

      if (response) {
        setEntries(prev => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map(e => e.id))
          const newUniqueEntries = response.entries.filter(e => !existingIds.has(e.id))
          return [...prev, ...newUniqueEntries]
        })
        setNextCursor(response.nextCursor)
        setHasMore(response.hasMore)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, nextCursor, isLoadingMore, isInitialLoading, subModule, date, level, debouncedSearch])

  // Silent refresh / live tail
  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    setError(null)
    try {
      const response = await adminLogsApi.getChunk({
        subModule,
        date: date || undefined,
        cursor: null,
        limit: 50,
        level,
        search: debouncedSearch || undefined,
      })

      if (response) {
        setEntries(response.entries)
        setNextCursor(response.nextCursor)
        setHasMore(response.hasMore)
        setTotalFileSizeBytes(response.totalFileSizeBytes)
        setAvailableDates(response.availableDates)
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsRefreshing(false)
    }
  }, [subModule, date, level, debouncedSearch])

  // Auto-refresh timer
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      void refreshRef.current()
    }, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Clear logs action
  const handleClearLogs = async () => {
    setIsClearing(true)
    try {
      const success = await adminLogsApi.clear({
        date: date || undefined,
        subModule: subModule !== 'all' ? subModule : undefined,
      })
      if (success) {
        setEntries([])
        setNextCursor(null)
        setHasMore(false)
        setIsClearModalOpen(false)
        await refresh()
      }
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setIsClearing(false)
    }
  }

  // Active file info
  const activeFileInfo = availableDates.find(f => f.date === date) || availableDates[0]

  return {
    subModule,
    setSubModule,
    date,
    setDate,
    level,
    setLevel,
    search,
    setSearch,
    entries,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    isRefreshing,
    error,
    autoRefresh,
    setAutoRefresh,
    isClearModalOpen,
    setIsClearModalOpen,
    isClearing,
    handleClearLogs,
    loadMore,
    refresh,
    availableDates,
    totalFileSizeBytes,
    activeFileInfo,
  }
}

