namespace pramukhraj.DTOs.Monitoring;

public sealed class BackgroundMetricsResponse
{
    public DateTimeOffset GeneratedAtUtc { get; init; }
    public required string WorkerState { get; init; }
    public bool Enabled { get; init; }
    public DateTimeOffset? StartedAtUtc { get; init; }
    public DateTimeOffset? LastHeartbeatUtc { get; init; }
    public DateTimeOffset? LastRunTimeUtc { get; init; }
    public DateTimeOffset? NextRunTimeUtc { get; init; }
    public double LastExecutionDurationMilliseconds { get; init; }
    public double AverageExecutionDurationMilliseconds { get; init; }
    public long CompletedIterations { get; init; }
    public long TotalItemsProcessed { get; init; }
    public long ItemsProcessedLastRun { get; init; }
    public long QueueDepth { get; init; }
    public int ConsecutiveErrorCount { get; init; }
    public string? LastErrorMessage { get; init; }
    public DateTimeOffset? LastErrorAtUtc { get; init; }
    public IReadOnlyList<BackgroundTaskMetricResponse> Tasks { get; init; } = [];
}

public sealed class BackgroundTaskMetricResponse
{
    public required string Name { get; init; }
    public required string State { get; init; }
    public DateTimeOffset? LastStartedAtUtc { get; init; }
    public DateTimeOffset? LastCompletedAtUtc { get; init; }
    public double LastDurationMilliseconds { get; init; }
    public double AverageDurationMilliseconds { get; init; }
    public long RunCount { get; init; }
    public long TotalItemsProcessed { get; init; }
    public long ItemsProcessedLastRun { get; init; }
    public long QueueDepth { get; init; }
    public int ConsecutiveErrorCount { get; init; }
    public string? LastErrorMessage { get; init; }
    public DateTimeOffset? LastErrorAtUtc { get; init; }
}
