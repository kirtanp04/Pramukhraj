using System.Data.Common;
using System.Diagnostics;
using Microsoft.Extensions.Options;
using pramukhraj.Interfaces;

namespace pramukhraj.BackgroundServices;

public sealed class ApplicationBackgroundService(
    IServiceScopeFactory scopeFactory,
    IOptions<BackgroundServiceOptions> options,
    IBackgroundMetricsStore metrics,
    ILogger<ApplicationBackgroundService> logger) : BackgroundService
{
    private readonly BackgroundServiceOptions _options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        metrics.MarkServiceStarted(_options.Enabled, DateTimeOffset.UtcNow);
        if (!_options.Enabled)
        {
            logger.LogInformation("Application background service is disabled.");
            metrics.MarkServiceStopped(DateTimeOffset.UtcNow);
            return;
        }

        logger.LogInformation("Application background service started.");

        try
        {
            if (_options.InitialDelaySeconds > 0)
                await Task.Delay(TimeSpan.FromSeconds(_options.InitialDelaySeconds), stoppingToken);

            await ExecuteTasksAsync(stoppingToken);

            using var timer = new PeriodicTimer(
                TimeSpan.FromMinutes(_options.ExecutionIntervalMinutes));
            while (await timer.WaitForNextTickAsync(stoppingToken))
                await ExecuteTasksAsync(stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Normal application shutdown.
        }
        catch (Exception exception)
        {
            metrics.MarkServiceFaulted("The scheduler stopped unexpectedly.", DateTimeOffset.UtcNow);
            logger.LogCritical(exception, "Application background service faulted.");
        }
        finally
        {
            logger.LogInformation("Application background service stopped.");
        }
    }

    private async Task ExecuteTasksAsync(CancellationToken cancellationToken)
    {
        var iterationTimer = Stopwatch.StartNew();
        metrics.MarkIterationStarted(DateTimeOffset.UtcNow);
        await using var scope = scopeFactory.CreateAsyncScope();
        var tasks = scope.ServiceProvider.GetServices<IApplicationBackgroundTask>();

        foreach (var task in tasks)
        {
            cancellationToken.ThrowIfCancellationRequested();
            logger.LogInformation("Starting background task {TaskName}.", task.Name);
            metrics.MarkTaskStarted(task.Name, DateTimeOffset.UtcNow);
            var taskTimer = Stopwatch.StartNew();

            try
            {
                await task.ExecuteAsync(cancellationToken);
                taskTimer.Stop();
                metrics.MarkTaskCompleted(task.Name, taskTimer.Elapsed, DateTimeOffset.UtcNow);
                logger.LogInformation("Background task {TaskName} completed.", task.Name);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (DbException exception)
            {
                taskTimer.Stop();
                metrics.MarkTaskFailed(
                    task.Name,
                    taskTimer.Elapsed,
                    "A database operation failed.",
                    DateTimeOffset.UtcNow);
                logger.LogError(exception, "Database error in background task {TaskName}.", task.Name);
            }
            catch (Exception exception)
            {
                taskTimer.Stop();
                metrics.MarkTaskFailed(
                    task.Name,
                    taskTimer.Elapsed,
                    "The task failed unexpectedly.",
                    DateTimeOffset.UtcNow);
                logger.LogError(exception, "Background task {TaskName} failed.", task.Name);
            }
        }

        iterationTimer.Stop();
        var completedAt = DateTimeOffset.UtcNow;
        metrics.MarkIterationCompleted(
            iterationTimer.Elapsed,
            completedAt,
            completedAt.AddMinutes(_options.ExecutionIntervalMinutes));
    }
}
