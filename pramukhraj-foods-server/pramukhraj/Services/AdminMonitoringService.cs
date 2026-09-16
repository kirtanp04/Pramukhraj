using System.Diagnostics;
using System.Runtime.InteropServices;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using pramukhraj.DTOs.Monitoring;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class AdminMonitoringService(
    IBackgroundMetricsStore backgroundMetrics,
    ServerMetricsSampler cpuSampler,
    HealthCheckService healthCheckService) : IAdminMonitoringService
{
    public BackgroundMetricsResponse GetBackgroundMetrics() =>
        backgroundMetrics.GetSnapshot();

    public async Task<ServerMetricsResponse> GetServerMetricsAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        using var process = Process.GetCurrentProcess();
        process.Refresh();
        var gc = GC.GetGCMemoryInfo();
        ThreadPool.GetAvailableThreads(out var availableWorkers, out var availableIo);
        ThreadPool.GetMaxThreads(out var maxWorkers, out var maxIo);
        var health = await healthCheckService.CheckHealthAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;

        return new ServerMetricsResponse
        {
            GeneratedAtUtc = now,
            ProcessCpuUsagePercentage = cpuSampler.SampleCpuUsagePercentage(),
            ProcessorCount = Environment.ProcessorCount,
            WorkingSetBytes = process.WorkingSet64,
            ManagedHeapBytes = GC.GetTotalMemory(false),
            GcHeapSizeBytes = gc.HeapSizeBytes,
            GcFragmentedBytes = gc.FragmentedBytes,
            GcMemoryLoadBytes = gc.MemoryLoadBytes,
            GcHighMemoryLoadThresholdBytes = gc.HighMemoryLoadThresholdBytes,
            Gen0Collections = GC.CollectionCount(0),
            Gen1Collections = GC.CollectionCount(1),
            Gen2Collections = GC.CollectionCount(2),
            ProcessUptimeSeconds = Math.Max(0, (long)(now - process.StartTime.ToUniversalTime()).TotalSeconds),
            SystemUptimeSeconds = Math.Max(0, Environment.TickCount64 / 1000),
            FrameworkDescription = RuntimeInformation.FrameworkDescription,
            OsDescription = RuntimeInformation.OSDescription,
            ProcessArchitecture = RuntimeInformation.ProcessArchitecture.ToString(),
            IsContainer = string.Equals(
                Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER"),
                "true",
                StringComparison.OrdinalIgnoreCase),
            ThreadPoolAvailableWorkerThreads = availableWorkers,
            ThreadPoolMaxWorkerThreads = maxWorkers,
            ThreadPoolAvailableIoThreads = availableIo,
            ThreadPoolMaxIoThreads = maxIo,
            ThreadPoolBusyWorkerThreads = Math.Max(0, maxWorkers - availableWorkers),
            Storage = GetStorageMetrics(),
            Dependencies = health.Entries
                .OrderBy(entry => entry.Key, StringComparer.Ordinal)
                .Select(entry => new DependencyHealthResponse
                {
                    Name = entry.Key,
                    Status = entry.Value.Status.ToString(),
                    DurationMilliseconds = Math.Round(entry.Value.Duration.TotalMilliseconds, 2),
                    Description = entry.Value.Status == HealthStatus.Healthy
                        ? "Operational"
                        : "Unavailable"
                })
                .ToArray(),
            UnsupportedMetrics =
            [
                new UnsupportedServerMetricResponse
                {
                    Name = "CPU core temperatures and fans",
                    Reason = "Unavailable reliably in virtual machines and application containers."
                },
                new UnsupportedServerMetricResponse
                {
                    Name = "Dedicated GPU load and VRAM",
                    Reason = "Requires dedicated hardware, vendor drivers and container device access."
                }
            ]
        };
    }

    private static IReadOnlyList<StorageMetricResponse> GetStorageMetrics()
    {
        var metrics = new List<StorageMetricResponse>();
        foreach (var drive in DriveInfo.GetDrives())
        {
            try
            {
                if (!drive.IsReady || drive.TotalSize <= 0)
                    continue;

                var used = drive.TotalSize - drive.AvailableFreeSpace;
                metrics.Add(new StorageMetricResponse
                {
                    Name = drive.Name,
                    DriveFormat = drive.DriveFormat,
                    TotalBytes = drive.TotalSize,
                    AvailableBytes = drive.AvailableFreeSpace,
                    UsedBytes = used,
                    UsedPercentage = Math.Round((double)used / drive.TotalSize * 100, 2)
                });
            }
            catch (IOException)
            {
                // Drives can disappear or become unavailable while being sampled.
            }
            catch (UnauthorizedAccessException)
            {
                // Ignore volumes the application process cannot inspect.
            }
        }

        return metrics;
    }
}
