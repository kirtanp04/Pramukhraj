using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using pramukhraj.DTOs.CacheMetrics;
using pramukhraj.Interfaces;
using System.Collections.Concurrent;

namespace pramukhraj.Services;

public sealed class MemoryCacheService : ICacheService
{
    private static readonly TimeSpan NearExpirationWindow = TimeSpan.FromMinutes(5);
    private const int MaxRecentEvictions = 100;
    private const int MaxTrackedKeyCounters = 20_000;

    private readonly IMemoryCache _cache;
    private readonly ILogger<MemoryCacheService> _logger;
    private readonly long _sizeLimit;
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
    private readonly ConcurrentDictionary<string, CacheEntryTelemetry> _entries = new();
    private readonly ConcurrentDictionary<string, CacheKeyCounters> _keyCounters = new();
    private readonly ConcurrentQueue<CacheEvictionMetricResponse> _recentEvictions = new();
    private long _totalHits;
    private long _totalMisses;
    private long _evictionCount;
    private long _lastEvictionUtcTicks;

    public MemoryCacheService(
        IMemoryCache cache,
        IOptions<MemoryCacheOptions> options,
        ILogger<MemoryCacheService> logger)
    {
        _cache = cache;
        _logger = logger;
        _sizeLimit = options.Value.SizeLimit ?? 0;
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentException.ThrowIfNullOrWhiteSpace(key);

        if (_cache.TryGetValue(key, out T? value))
        {
            TrackHit(key);
            return Task.FromResult(value);
        }

        TrackMiss(key);
        return Task.FromResult(default(T));
    }

    public Task SetAsync<T>(
        string key,
        T value,
        TimeSpan expiration,
        int size = 1,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentException.ThrowIfNullOrWhiteSpace(key);

        SetEntry(key, value, expiration, size);
        return Task.CompletedTask;
    }

    public async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        TimeSpan expiration,
        int size = 1,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        ArgumentNullException.ThrowIfNull(factory);

        if (_cache.TryGetValue(key, out T? cachedValue) && cachedValue is not null)
        {
            TrackHit(key);
            return cachedValue;
        }

        TrackMiss(key);
        var semaphore = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync(cancellationToken);

        try
        {
            if (_cache.TryGetValue(key, out cachedValue) && cachedValue is not null)
            {
                return cachedValue;
            }

            var value = await factory(cancellationToken);
            SetEntry(key, value, expiration, size);
            return value;
        }
        finally
        {
            semaphore.Release();
            if (semaphore.CurrentCount == 1)
            {
                _locks.TryRemove(key, out _);
            }
        }
    }

    public void Remove(string key, string? invalidationReason = null)
    {
        if (string.IsNullOrWhiteSpace(key)) return;

        if (_entries.TryGetValue(key, out var entry))
        {
            entry.ManualInvalidationReason = NormalizeReason(invalidationReason, "Direct cache invalidation");
        }

        _cache.Remove(key);
        if (entry is not null) RemoveTelemetryIfCurrent(entry);
    }

    public void RemoveByPrefix(string prefix, string? invalidationReason = null)
    {
        if (string.IsNullOrWhiteSpace(prefix)) return;

        var matchingKeys = _entries.Keys
            .Where(key => key.StartsWith(prefix, StringComparison.Ordinal))
            .ToArray();
        var reason = NormalizeReason(invalidationReason, $"Prefix invalidation: {prefix}");

        foreach (var key in matchingKeys)
        {
            Remove(key, reason);
        }
    }

    public CacheMetricsResponse GetMetrics()
    {
        var now = DateTimeOffset.UtcNow;
        var entries = _entries.Values
            .Where(entry => entry.AbsoluteExpirationAtUtc is null || entry.AbsoluteExpirationAtUtc > now)
            .Select(entry => ToResponse(entry, now))
            .OrderBy(entry => entry.AbsoluteExpirationAtUtc ?? DateTimeOffset.MaxValue)
            .ThenBy(entry => entry.Key, StringComparer.Ordinal)
            .ToArray();

        var hits = Interlocked.Read(ref _totalHits);
        var misses = Interlocked.Read(ref _totalMisses);
        var requestCount = hits + misses;
        var currentSize = entries.Sum(entry => (long)entry.Size);
        var lastEvictionTicks = Interlocked.Read(ref _lastEvictionUtcTicks);

        return new CacheMetricsResponse
        {
            GeneratedAtUtc = now,
            TotalCachedEntries = entries.Length,
            CacheSizeLimit = _sizeLimit,
            CurrentEstimatedCacheSize = currentSize,
            CacheMemoryPercentage = _sizeLimit > 0 ? Math.Round(currentSize * 100m / _sizeLimit, 2) : 0,
            TotalCacheHits = hits,
            TotalCacheMisses = misses,
            HitRatioPercentage = requestCount > 0 ? Math.Round(hits * 100m / requestCount, 2) : 0,
            EvictionCount = Interlocked.Read(ref _evictionCount),
            LastEvictionAtUtc = lastEvictionTicks > 0 ? new DateTimeOffset(lastEvictionTicks, TimeSpan.Zero) : null,
            EntriesNearingExpiration = entries.Count(entry => entry.IsNearingExpiration),
            Entries = entries
                .OrderByDescending(entry => entry.CreatedAtUtc)
                .ThenByDescending(entry => entry.Key, StringComparer.Ordinal)
                .ToArray(),
            ExpiringNext = entries.Where(entry => entry.AbsoluteExpirationAtUtc is not null).Take(5).ToArray(),
            SizeDistribution = entries
                .GroupBy(entry => entry.Group, StringComparer.OrdinalIgnoreCase)
                .Select(group => new CacheSizeDistributionResponse
                {
                    Group = group.Key,
                    EntryCount = group.Count(),
                    Size = group.Sum(entry => (long)entry.Size)
                })
                .OrderByDescending(group => group.Size)
                .ThenBy(group => group.Group, StringComparer.OrdinalIgnoreCase)
                .ToArray(),
            RecentEvictions = _recentEvictions.Reverse().ToArray()
        };
    }

    public bool InvalidateKey(string key, string invalidationReason)
    {
        if (string.IsNullOrWhiteSpace(key) || !_entries.ContainsKey(key)) return false;
        Remove(key, invalidationReason);
        return true;
    }

    public int InvalidateModule(string module, string invalidationReason)
    {
        if (string.IsNullOrWhiteSpace(module)) return 0;

        var keys = _entries.Values
            .Where(entry => string.Equals(GetKeyGroup(entry.Key), module.Trim(), StringComparison.OrdinalIgnoreCase))
            .Select(entry => entry.Key)
            .ToArray();

        foreach (var key in keys) Remove(key, invalidationReason);
        return keys.Length;
    }

    public int Clear(string invalidationReason)
    {
        var keys = _entries.Keys.ToArray();
        foreach (var key in keys) Remove(key, invalidationReason);
        return keys.Length;
    }

    private void SetEntry<T>(string key, T value, TimeSpan expiration, int size)
    {
        var now = DateTimeOffset.UtcNow;
        var telemetry = new CacheEntryTelemetry
        {
            Version = Guid.NewGuid(),
            Key = key,
            Size = Math.Max(size, 1),
            CreatedAtUtc = now,
            AbsoluteExpirationAtUtc = now.Add(expiration),
            DataType = GetFriendlyTypeName(typeof(T)),
            Priority = CacheItemPriority.Normal.ToString()
        };

        _entries[key] = telemetry;

        try
        {
            _cache.Set(key, value, CreateOptions(telemetry, expiration));
        }
        catch
        {
            if (_entries.TryGetValue(key, out var current) && current.Version == telemetry.Version)
            {
                _entries.TryRemove(key, out _);
            }
            throw;
        }
    }

    private MemoryCacheEntryOptions CreateOptions(CacheEntryTelemetry telemetry, TimeSpan expiration)
    {
        return new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(expiration)
            .SetSize(telemetry.Size)
            .SetPriority(CacheItemPriority.Normal)
            .RegisterPostEvictionCallback((key, _, reason, _) =>
            {
                RemoveTelemetryIfCurrent(telemetry);

                var evictedAt = DateTimeOffset.UtcNow;
                Interlocked.Increment(ref _evictionCount);
                Interlocked.Exchange(ref _lastEvictionUtcTicks, evictedAt.UtcTicks);
                _recentEvictions.Enqueue(new CacheEvictionMetricResponse
                {
                    Key = key?.ToString() ?? telemetry.Key,
                    Reason = reason.ToString(),
                    ManualInvalidationReason = telemetry.ManualInvalidationReason,
                    EvictedAtUtc = evictedAt,
                    Size = telemetry.Size,
                    DataType = telemetry.DataType
                });

                while (_recentEvictions.Count > MaxRecentEvictions)
                {
                    _recentEvictions.TryDequeue(out _);
                }

                _logger.LogDebug(
                    "Cache entry {CacheKey} evicted. Reason: {Reason}. Invalidation: {InvalidationReason}",
                    telemetry.Key,
                    reason,
                    telemetry.ManualInvalidationReason);
            });
    }

    private void TrackHit(string key)
    {
        Interlocked.Increment(ref _totalHits);
        var counters = _keyCounters.GetOrAdd(key, _ => new CacheKeyCounters());
        Interlocked.Increment(ref counters.Hits);
        TrimKeyCountersIfNeeded();

        if (_entries.TryGetValue(key, out var entry))
        {
            Interlocked.Exchange(ref entry.LastAccessedUtcTicks, DateTimeOffset.UtcNow.UtcTicks);
        }
    }

    private void TrackMiss(string key)
    {
        Interlocked.Increment(ref _totalMisses);
        var counters = _keyCounters.GetOrAdd(key, _ => new CacheKeyCounters());
        Interlocked.Increment(ref counters.Misses);
        TrimKeyCountersIfNeeded();
    }

    private CacheEntryMetricResponse ToResponse(CacheEntryTelemetry entry, DateTimeOffset now)
    {
        _keyCounters.TryGetValue(entry.Key, out var counters);
        var remaining = entry.AbsoluteExpirationAtUtc - now;
        var lastAccessedTicks = Interlocked.Read(ref entry.LastAccessedUtcTicks);

        return new CacheEntryMetricResponse
        {
            Key = entry.Key,
            Group = GetKeyGroup(entry.Key),
            Size = entry.Size,
            CreatedAtUtc = entry.CreatedAtUtc,
            AbsoluteExpirationAtUtc = entry.AbsoluteExpirationAtUtc,
            RemainingTtlSeconds = remaining?.TotalSeconds,
            SlidingExpirationSeconds = entry.SlidingExpiration?.TotalSeconds,
            LastAccessedAtUtc = lastAccessedTicks > 0 ? new DateTimeOffset(lastAccessedTicks, TimeSpan.Zero) : null,
            Hits = counters is null ? 0 : Interlocked.Read(ref counters.Hits),
            Misses = counters is null ? 0 : Interlocked.Read(ref counters.Misses),
            DataType = entry.DataType,
            Priority = entry.Priority,
            IsNearingExpiration = remaining is not null && remaining > TimeSpan.Zero && remaining <= NearExpirationWindow
        };
    }

    private static string GetKeyGroup(string key)
    {
        var parts = key.Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length < 2) return "Other";
        return char.ToUpperInvariant(parts[1][0]) + parts[1][1..];
    }

    private static string GetFriendlyTypeName(Type type)
    {
        if (!type.IsGenericType) return type.Name;
        var name = type.Name[..type.Name.IndexOf('`')];
        return $"{name}<{string.Join(", ", type.GetGenericArguments().Select(GetFriendlyTypeName))}>";
    }

    private static string NormalizeReason(string? reason, string fallback)
        => string.IsNullOrWhiteSpace(reason) ? fallback : reason.Trim();

    private void RemoveTelemetryIfCurrent(CacheEntryTelemetry telemetry)
    {
        ((ICollection<KeyValuePair<string, CacheEntryTelemetry>>)_entries)
            .Remove(new KeyValuePair<string, CacheEntryTelemetry>(telemetry.Key, telemetry));
    }

    private void TrimKeyCountersIfNeeded()
    {
        if (_keyCounters.Count <= MaxTrackedKeyCounters) return;

        foreach (var key in _keyCounters.Keys)
        {
            if (!_entries.ContainsKey(key)) _keyCounters.TryRemove(key, out _);
            if (_keyCounters.Count <= MaxTrackedKeyCounters / 2) break;
        }
    }

    private sealed class CacheEntryTelemetry
    {
        public required Guid Version { get; init; }
        public required string Key { get; init; }
        public required int Size { get; init; }
        public required DateTimeOffset CreatedAtUtc { get; init; }
        public DateTimeOffset? AbsoluteExpirationAtUtc { get; init; }
        public TimeSpan? SlidingExpiration { get; init; }
        public required string DataType { get; init; }
        public required string Priority { get; init; }
        public long LastAccessedUtcTicks;
        public string? ManualInvalidationReason { get; set; }
    }

    private sealed class CacheKeyCounters
    {
        public long Hits;
        public long Misses;
    }
}
