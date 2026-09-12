namespace pramukhraj.Interfaces
{
    public interface ICacheService
    {
        Task<T?> GetAsync<T>(string key,CancellationToken cancellationToken = default);

        Task SetAsync<T>(
            string key,
            T value,
            TimeSpan expiration,
            int size = 1,
            CancellationToken cancellationToken = default);

        Task<T> GetOrCreateAsync<T>(
            string key,
            Func<CancellationToken, Task<T>> factory,
            TimeSpan expiration,
            int size = 1,
            CancellationToken cancellationToken = default);

        void Remove(string key, string? invalidationReason = null);

        void RemoveByPrefix(string prefix, string? invalidationReason = null);

        DTOs.CacheMetrics.CacheMetricsResponse GetMetrics();

        bool InvalidateKey(string key, string invalidationReason);

        int InvalidateModule(string module, string invalidationReason);

        int Clear(string invalidationReason);
    }
}
