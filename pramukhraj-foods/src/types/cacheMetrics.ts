export interface CacheEntryMetric {
  key: string
  group: string
  size: number
  createdAtUtc: string
  absoluteExpirationAtUtc: string | null
  remainingTtlSeconds: number | null
  slidingExpirationSeconds: number | null
  lastAccessedAtUtc: string | null
  hits: number
  misses: number
  dataType: string
  priority: string
  isNearingExpiration: boolean
}

export interface CacheSizeDistribution {
  group: string
  entryCount: number
  size: number
}

export interface CacheEvictionMetric {
  key: string
  reason: string
  manualInvalidationReason: string | null
  evictedAtUtc: string
  size: number
  dataType: string
}

export interface CacheMetrics {
  generatedAtUtc: string
  totalCachedEntries: number
  cacheSizeLimit: number
  currentEstimatedCacheSize: number
  cacheMemoryPercentage: number
  totalCacheHits: number
  totalCacheMisses: number
  hitRatioPercentage: number
  evictionCount: number
  lastEvictionAtUtc: string | null
  entriesNearingExpiration: number
  entries: CacheEntryMetric[]
  expiringNext: CacheEntryMetric[]
  sizeDistribution: CacheSizeDistribution[]
  recentEvictions: CacheEvictionMetric[]
}

export interface CacheInvalidationResult {
  scope: 'All' | 'Key' | 'Module'
  target: string | null
  invalidatedEntries: number
  invalidatedAtUtc: string
}
