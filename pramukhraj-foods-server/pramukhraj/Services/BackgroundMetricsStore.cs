using pramukhraj.DTOs.Monitoring;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class BackgroundMetricsStore : IBackgroundMetricsStore
{
    private readonly object _sync = new();
    private readonly Dictionary<string, TaskMetric> _tasks = new(StringComparer.Ordinal);
    private string _workerState = "Stopped";
    private bool _enabled;
    private bool _iterationFailed;
    private DateTimeOffset? _startedAtUtc;
    private DateTimeOffset? _lastHeartbeatUtc;
    private DateTimeOffset? _lastRunTimeUtc;
    private DateTimeOffset? _nextRunTimeUtc;
    private double _lastDurationMilliseconds;
    private double _averageDurationMilliseconds;
    private long _completedIterations;
    private long _totalItemsProcessed;
    private long _currentIterationItems;
    private long _itemsProcessedLastRun;
    private int _consecutiveErrorCount;
    private string? _lastErrorMessage;
    private DateTimeOffset? _lastErrorAtUtc;

    public void MarkServiceStarted(bool enabled, DateTimeOffset timestamp)
    {
        lock (_sync)
        {
            _enabled = enabled;
            _workerState = enabled ? "Idle" : "Stopped";
            _startedAtUtc = enabled ? timestamp : null;
            _lastHeartbeatUtc = timestamp;
        }
    }

    public void MarkServiceStopped(DateTimeOffset timestamp)
    {
        lock (_sync)
        {
            if (_workerState != "Faulted")
                _workerState = "Stopped";
            _lastHeartbeatUtc = timestamp;
            _nextRunTimeUtc = null;
        }
    }

    public void MarkServiceFaulted(string safeErrorMessage, DateTimeOffset timestamp)
    {
        lock (_sync)
        {
            _workerState = "Faulted";
            _lastHeartbeatUtc = timestamp;
            _lastErrorMessage = safeErrorMessage;
            _lastErrorAtUtc = timestamp;
            _consecutiveErrorCount++;
        }
    }

    public void MarkIterationStarted(DateTimeOffset timestamp)
    {
        lock (_sync)
        {
            _workerState = "Running";
            _lastHeartbeatUtc = timestamp;
            _currentIterationItems = 0;
            _iterationFailed = false;
            _nextRunTimeUtc = null;
        }
    }

    public void MarkIterationCompleted(TimeSpan duration, DateTimeOffset timestamp, DateTimeOffset nextRunTime)
    {
        lock (_sync)
        {
            _completedIterations++;
            _lastDurationMilliseconds = duration.TotalMilliseconds;
            _averageDurationMilliseconds = RunningAverage(
                _averageDurationMilliseconds,
                _lastDurationMilliseconds,
                _completedIterations);
            _itemsProcessedLastRun = _currentIterationItems;
            _lastRunTimeUtc = timestamp;
            _lastHeartbeatUtc = timestamp;
            _nextRunTimeUtc = nextRunTime;
            _workerState = "Idle";
            _consecutiveErrorCount = _iterationFailed ? _consecutiveErrorCount + 1 : 0;
        }
    }

    public void MarkTaskStarted(string taskName, DateTimeOffset timestamp)
    {
        lock (_sync)
        {
            var task = GetOrCreate(taskName);
            task.State = "Running";
            task.LastStartedAtUtc = timestamp;
            task.ItemsProcessedLastRun = 0;
            _lastHeartbeatUtc = timestamp;
        }
    }

    public void MarkTaskCompleted(string taskName, TimeSpan duration, DateTimeOffset timestamp)
    {
        lock (_sync)
        {
            var task = GetOrCreate(taskName);
            task.RunCount++;
            task.State = "Idle";
            task.LastCompletedAtUtc = timestamp;
            task.LastDurationMilliseconds = duration.TotalMilliseconds;
            task.AverageDurationMilliseconds = RunningAverage(
                task.AverageDurationMilliseconds,
                task.LastDurationMilliseconds,
                task.RunCount);
            task.ConsecutiveErrorCount = 0;
            _lastHeartbeatUtc = timestamp;
        }
    }

    public void MarkTaskFailed(string taskName, TimeSpan duration, string safeErrorMessage, DateTimeOffset timestamp)
    {
        lock (_sync)
        {
            var task = GetOrCreate(taskName);
            task.RunCount++;
            task.State = "Faulted";
            task.LastCompletedAtUtc = timestamp;
            task.LastDurationMilliseconds = duration.TotalMilliseconds;
            task.AverageDurationMilliseconds = RunningAverage(
                task.AverageDurationMilliseconds,
                task.LastDurationMilliseconds,
                task.RunCount);
            task.ConsecutiveErrorCount++;
            task.LastErrorMessage = safeErrorMessage;
            task.LastErrorAtUtc = timestamp;
            _iterationFailed = true;
            _lastErrorMessage = $"{taskName}: {safeErrorMessage}";
            _lastErrorAtUtc = timestamp;
            _lastHeartbeatUtc = timestamp;
        }
    }

    public void ReportTaskWork(string taskName, long itemsProcessed, long queueDepth)
    {
        lock (_sync)
        {
            var task = GetOrCreate(taskName);
            var safeProcessed = Math.Max(itemsProcessed, 0);
            task.ItemsProcessedLastRun += safeProcessed;
            task.TotalItemsProcessed += safeProcessed;
            task.QueueDepth = Math.Max(queueDepth, 0);
            _currentIterationItems += safeProcessed;
            _totalItemsProcessed += safeProcessed;
        }
    }

    public BackgroundMetricsResponse GetSnapshot()
    {
        lock (_sync)
        {
            return new BackgroundMetricsResponse
            {
                GeneratedAtUtc = DateTimeOffset.UtcNow,
                WorkerState = _workerState,
                Enabled = _enabled,
                StartedAtUtc = _startedAtUtc,
                LastHeartbeatUtc = _lastHeartbeatUtc,
                LastRunTimeUtc = _lastRunTimeUtc,
                NextRunTimeUtc = _nextRunTimeUtc,
                LastExecutionDurationMilliseconds = _lastDurationMilliseconds,
                AverageExecutionDurationMilliseconds = _averageDurationMilliseconds,
                CompletedIterations = _completedIterations,
                TotalItemsProcessed = _totalItemsProcessed,
                ItemsProcessedLastRun = _itemsProcessedLastRun,
                QueueDepth = _tasks.Values.Sum(task => task.QueueDepth),
                ConsecutiveErrorCount = _consecutiveErrorCount,
                LastErrorMessage = _lastErrorMessage,
                LastErrorAtUtc = _lastErrorAtUtc,
                Tasks = _tasks.Values
                    .OrderBy(task => task.Name, StringComparer.Ordinal)
                    .Select(task => task.ToResponse())
                    .ToArray()
            };
        }
    }

    private TaskMetric GetOrCreate(string name)
    {
        if (_tasks.TryGetValue(name, out var task))
            return task;

        task = new TaskMetric(name);
        _tasks.Add(name, task);
        return task;
    }

    private static double RunningAverage(double average, double value, long count) =>
        average + ((value - average) / count);

    private sealed class TaskMetric(string name)
    {
        public string Name { get; } = name;
        public string State { get; set; } = "Idle";
        public DateTimeOffset? LastStartedAtUtc { get; set; }
        public DateTimeOffset? LastCompletedAtUtc { get; set; }
        public double LastDurationMilliseconds { get; set; }
        public double AverageDurationMilliseconds { get; set; }
        public long RunCount { get; set; }
        public long TotalItemsProcessed { get; set; }
        public long ItemsProcessedLastRun { get; set; }
        public long QueueDepth { get; set; }
        public int ConsecutiveErrorCount { get; set; }
        public string? LastErrorMessage { get; set; }
        public DateTimeOffset? LastErrorAtUtc { get; set; }

        public BackgroundTaskMetricResponse ToResponse() => new()
        {
            Name = Name,
            State = State,
            LastStartedAtUtc = LastStartedAtUtc,
            LastCompletedAtUtc = LastCompletedAtUtc,
            LastDurationMilliseconds = LastDurationMilliseconds,
            AverageDurationMilliseconds = AverageDurationMilliseconds,
            RunCount = RunCount,
            TotalItemsProcessed = TotalItemsProcessed,
            ItemsProcessedLastRun = ItemsProcessedLastRun,
            QueueDepth = QueueDepth,
            ConsecutiveErrorCount = ConsecutiveErrorCount,
            LastErrorMessage = LastErrorMessage,
            LastErrorAtUtc = LastErrorAtUtc
        };
    }
}
