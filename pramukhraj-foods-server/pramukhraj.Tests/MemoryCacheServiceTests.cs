using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class MemoryCacheServiceTests
{
    [Fact]
    public async Task Metrics_TrackEntriesSizeHitsMissesAndExpiration()
    {
        var options = new MemoryCacheOptions { SizeLimit = 100 };
        using var memoryCache = new MemoryCache(options);
        var service = new MemoryCacheService(
            memoryCache,
            Options.Create(options),
            NullLogger<MemoryCacheService>.Instance);

        var created = await service.GetOrCreateAsync(
            "pramukhraj:products:test",
            _ => Task.FromResult("cached-value"),
            TimeSpan.FromMinutes(2),
            size: 7);
        var cached = await service.GetOrCreateAsync(
            "pramukhraj:products:test",
            _ => Task.FromResult("different-value"),
            TimeSpan.FromMinutes(2),
            size: 7);
        var missing = await service.GetAsync<string>("pramukhraj:products:missing");
        var metrics = service.GetMetrics();

        Assert.Equal("cached-value", created);
        Assert.Equal("cached-value", cached);
        Assert.Null(missing);
        Assert.Equal(1, metrics.TotalCachedEntries);
        Assert.Equal(100, metrics.CacheSizeLimit);
        Assert.Equal(7, metrics.CurrentEstimatedCacheSize);
        Assert.Equal(7m, metrics.CacheMemoryPercentage);
        Assert.Equal(1, metrics.TotalCacheHits);
        Assert.Equal(2, metrics.TotalCacheMisses);
        Assert.Equal(1, metrics.EntriesNearingExpiration);
        Assert.Equal("Products", metrics.Entries[0].Group);
        Assert.Equal("String", metrics.Entries[0].DataType);
        Assert.NotNull(metrics.Entries[0].LastAccessedAtUtc);
    }

    [Fact]
    public async Task ManualRemoval_TracksEvictionReasonAndDetail()
    {
        var options = new MemoryCacheOptions { SizeLimit = 100 };
        using var memoryCache = new MemoryCache(options);
        var service = new MemoryCacheService(
            memoryCache,
            Options.Create(options),
            NullLogger<MemoryCacheService>.Instance);

        await service.SetAsync("pramukhraj:faqs:test", new[] { 1, 2 }, TimeSpan.FromHours(1), 2);
        service.Remove("pramukhraj:faqs:test", "FAQ updated by admin");

        var recorded = SpinWait.SpinUntil(() => service.GetMetrics().EvictionCount == 1, TimeSpan.FromSeconds(2));
        var metrics = service.GetMetrics();

        Assert.True(recorded);
        Assert.Empty(metrics.Entries);
        Assert.Equal("Removed", metrics.RecentEvictions[0].Reason);
        Assert.Equal("FAQ updated by admin", metrics.RecentEvictions[0].ManualInvalidationReason);
        Assert.NotNull(metrics.LastEvictionAtUtc);
    }

    [Fact]
    public async Task ModuleAndFullInvalidation_RemoveOnlyRequestedEntries()
    {
        var options = new MemoryCacheOptions { SizeLimit = 100 };
        using var memoryCache = new MemoryCache(options);
        var service = new MemoryCacheService(
            memoryCache,
            Options.Create(options),
            NullLogger<MemoryCacheService>.Instance);

        await service.SetAsync("pramukhraj:products:one", 1, TimeSpan.FromHours(1));
        await service.SetAsync("pramukhraj:products:two", 2, TimeSpan.FromHours(1));
        await service.SetAsync("pramukhraj:faqs:one", 3, TimeSpan.FromHours(1));

        var moduleCount = service.InvalidateModule("PRODUCTS", "Products cleared by admin");

        Assert.Equal(2, moduleCount);
        Assert.Single(service.GetMetrics().Entries);
        Assert.Equal("Faqs", service.GetMetrics().Entries[0].Group);

        var allCount = service.Clear("Entire cache cleared by admin");

        Assert.Equal(1, allCount);
        Assert.Empty(service.GetMetrics().Entries);
    }

    [Fact]
    public async Task ExactKeyInvalidation_ReturnsWhetherKeyWasActive()
    {
        var options = new MemoryCacheOptions { SizeLimit = 100 };
        using var memoryCache = new MemoryCache(options);
        var service = new MemoryCacheService(
            memoryCache,
            Options.Create(options),
            NullLogger<MemoryCacheService>.Instance);
        const string key = "pramukhraj:reviews:one";

        await service.SetAsync(key, "review", TimeSpan.FromHours(1));

        Assert.True(service.InvalidateKey(key, "Review cache cleared by admin"));
        Assert.False(service.InvalidateKey(key, "Repeated request"));
        Assert.Empty(service.GetMetrics().Entries);
    }
}
