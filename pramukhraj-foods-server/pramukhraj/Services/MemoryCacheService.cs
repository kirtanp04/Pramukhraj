using Microsoft.Extensions.Caching.Memory;
using pramukhraj.Interfaces;
using System.Collections.Concurrent;

namespace pramukhraj.Services
{
    public class MemoryCacheService: ICacheService
    {
        private readonly IMemoryCache _cache;
        private readonly ILogger<MemoryCacheService> _logger;

        private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

        private readonly ConcurrentDictionary<string, byte> _keys = new();

        public MemoryCacheService(IMemoryCache cache,ILogger<MemoryCacheService> logger)
        {
            _cache = cache;
            _logger = logger;
        }


        public Task<T?> GetAsync<T>(string key,CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (_cache.TryGetValue(key, out T? value))
            {
                return Task.FromResult(value);
            }

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

            var options = CreateOptions(
                key,
                expiration,
                size);

            _cache.Set(
                key,
                value,
                options);

            _keys.TryAdd(key, 0);

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

            if (_cache.TryGetValue(key, out T? cachedValue) &&
                cachedValue is not null)
            {
                return cachedValue;
            }

            var semaphore = _locks.GetOrAdd(
                key,
                _ => new SemaphoreSlim(1, 1));

            await semaphore.WaitAsync(cancellationToken);

            try
            {
                // Double-check after acquiring lock.
                if (_cache.TryGetValue(key, out cachedValue) &&
                    cachedValue is not null)
                {
                    return cachedValue;
                }

                var value = await factory(cancellationToken);

                var options = CreateOptions(
                    key,
                    expiration,
                    size);

                _cache.Set(
                    key,
                    value,
                    options);

                _keys.TryAdd(key, 0);

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

        public void Remove(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
                return;

            _cache.Remove(key);

            _keys.TryRemove(key, out _);
        }

        public void RemoveByPrefix(string prefix)
        {
            if (string.IsNullOrWhiteSpace(prefix))
                return;

            var matchingKeys = _keys.Keys
                .Where(key =>
                    key.StartsWith(
                        prefix,
                        StringComparison.Ordinal))
                .ToArray();

            foreach (var key in matchingKeys)
            {
                _cache.Remove(key);

                _keys.TryRemove(key, out _);
            }
        }

        private MemoryCacheEntryOptions CreateOptions(
            string key,
            TimeSpan expiration,
            int size)
        {
            return new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(expiration)
                .SetSize(Math.Max(size, 1))
                .RegisterPostEvictionCallback(
                    (_, _, reason, _) =>
                    {
                        // Replacing an entry also triggers this callback. Keep the
                        // key registered when a newer value already exists so
                        // prefix invalidation can still find it.
                        if (!_cache.TryGetValue(key, out object? _))
                        {
                            _keys.TryRemove(key, out _);
                        }

                        _logger.LogDebug(
                            "Cache entry {CacheKey} evicted. Reason: {Reason}",
                            key,
                            reason);
                    });
        }

    }
}
