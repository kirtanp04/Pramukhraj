namespace pramukhraj.DTOs.Monitoring;

public sealed class ServerMetricsResponse
{
    public DateTimeOffset GeneratedAtUtc { get; init; }
    public double ProcessCpuUsagePercentage { get; init; }
    public int ProcessorCount { get; init; }
    public long WorkingSetBytes { get; init; }
    public long ManagedHeapBytes { get; init; }
    public long GcHeapSizeBytes { get; init; }
    public long GcFragmentedBytes { get; init; }
    public long GcMemoryLoadBytes { get; init; }
    public long GcHighMemoryLoadThresholdBytes { get; init; }
    public int Gen0Collections { get; init; }
    public int Gen1Collections { get; init; }
    public int Gen2Collections { get; init; }
    public long ProcessUptimeSeconds { get; init; }
    public long SystemUptimeSeconds { get; init; }
    public required string FrameworkDescription { get; init; }
    public required string OsDescription { get; init; }
    public required string ProcessArchitecture { get; init; }
    public bool IsContainer { get; init; }
    public int ThreadPoolAvailableWorkerThreads { get; init; }
    public int ThreadPoolMaxWorkerThreads { get; init; }
    public int ThreadPoolAvailableIoThreads { get; init; }
    public int ThreadPoolMaxIoThreads { get; init; }
    public int ThreadPoolBusyWorkerThreads { get; init; }
    public IReadOnlyList<StorageMetricResponse> Storage { get; init; } = [];
    public IReadOnlyList<DependencyHealthResponse> Dependencies { get; init; } = [];
    public IReadOnlyList<UnsupportedServerMetricResponse> UnsupportedMetrics { get; init; } = [];
}

public sealed class StorageMetricResponse
{
    public required string Name { get; init; }
    public required string DriveFormat { get; init; }
    public long TotalBytes { get; init; }
    public long AvailableBytes { get; init; }
    public long UsedBytes { get; init; }
    public double UsedPercentage { get; init; }
}

public sealed class DependencyHealthResponse
{
    public required string Name { get; init; }
    public required string Status { get; init; }
    public double DurationMilliseconds { get; init; }
    public string? Description { get; init; }
}

public sealed class UnsupportedServerMetricResponse
{
    public required string Name { get; init; }
    public required string Reason { get; init; }
}
