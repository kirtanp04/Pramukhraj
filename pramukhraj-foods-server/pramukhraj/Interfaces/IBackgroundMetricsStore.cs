using pramukhraj.DTOs.Monitoring;

namespace pramukhraj.Interfaces;

public interface IBackgroundMetricsStore
{
    void MarkServiceStarted(bool enabled, DateTimeOffset timestamp);
    void MarkServiceStopped(DateTimeOffset timestamp);
    void MarkServiceFaulted(string safeErrorMessage, DateTimeOffset timestamp);
    void MarkIterationStarted(DateTimeOffset timestamp);
    void MarkIterationCompleted(TimeSpan duration, DateTimeOffset timestamp, DateTimeOffset nextRunTime);
    void MarkTaskStarted(string taskName, DateTimeOffset timestamp);
    void MarkTaskCompleted(string taskName, TimeSpan duration, DateTimeOffset timestamp);
    void MarkTaskFailed(string taskName, TimeSpan duration, string safeErrorMessage, DateTimeOffset timestamp);
    void ReportTaskWork(string taskName, long itemsProcessed, long queueDepth);
    BackgroundMetricsResponse GetSnapshot();
}
