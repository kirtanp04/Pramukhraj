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

        void Remove(string key);

        void RemoveByPrefix(string prefix);
    }
}
