namespace pramukhraj.DTOs.CacheMetrics;

public sealed class CacheInvalidationResponse
{
    public required string Scope { get; init; }
    public string? Target { get; init; }
    public int InvalidatedEntries { get; init; }
    public DateTimeOffset InvalidatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
