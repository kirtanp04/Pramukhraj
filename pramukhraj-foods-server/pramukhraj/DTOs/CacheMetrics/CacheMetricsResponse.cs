namespace pramukhraj.DTOs.CacheMetrics;

public sealed class CacheMetricsResponse
{
    public DateTimeOffset GeneratedAtUtc { get; init; }
    public int TotalCachedEntries { get; init; }
    public long CacheSizeLimit { get; init; }
    public long CurrentEstimatedCacheSize { get; init; }
    public decimal CacheMemoryPercentage { get; init; }
    public long TotalCacheHits { get; init; }
    public long TotalCacheMisses { get; init; }
    public decimal HitRatioPercentage { get; init; }
    public long EvictionCount { get; init; }
    public DateTimeOffset? LastEvictionAtUtc { get; init; }
    public int EntriesNearingExpiration { get; init; }
    public IReadOnlyList<CacheEntryMetricResponse> Entries { get; init; } = [];
    public IReadOnlyList<CacheEntryMetricResponse> ExpiringNext { get; init; } = [];
    public IReadOnlyList<CacheSizeDistributionResponse> SizeDistribution { get; init; } = [];
    public IReadOnlyList<CacheEvictionMetricResponse> RecentEvictions { get; init; } = [];
}

public sealed class CacheEntryMetricResponse
{
    public required string Key { get; init; }
    public required string Group { get; init; }
    public int Size { get; init; }
    public DateTimeOffset CreatedAtUtc { get; init; }
    public DateTimeOffset? AbsoluteExpirationAtUtc { get; init; }
    public double? RemainingTtlSeconds { get; init; }
    public double? SlidingExpirationSeconds { get; init; }
    public DateTimeOffset? LastAccessedAtUtc { get; init; }
    public long Hits { get; init; }
    public long Misses { get; init; }
    public required string DataType { get; init; }
    public required string Priority { get; init; }
    public bool IsNearingExpiration { get; init; }
}

public sealed class CacheSizeDistributionResponse
{
    public required string Group { get; init; }
    public int EntryCount { get; init; }
    public long Size { get; init; }
}

public sealed class CacheEvictionMetricResponse
{
    public required string Key { get; init; }
    public required string Reason { get; init; }
    public string? ManualInvalidationReason { get; init; }
    public DateTimeOffset EvictedAtUtc { get; init; }
    public int Size { get; init; }
    public required string DataType { get; init; }
}
