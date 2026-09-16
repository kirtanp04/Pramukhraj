using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using pramukhraj.BackgroundServices;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class ApplicationBackgroundServiceTests
{
    [Fact]
    public async Task FailingTask_DoesNotPreventNextTaskFromRunning()
    {
        var successfulTask = new RecordingTask("successful");
        var services = new ServiceCollection();
        services.AddScoped<IApplicationBackgroundTask>(_ => new FailingTask());
        services.AddScoped<IApplicationBackgroundTask>(_ => successfulTask);
        await using var provider = services.BuildServiceProvider();
        var service = CreateService(provider, enabled: true);

        await service.StartAsync(CancellationToken.None);
        await successfulTask.Executed.Task.WaitAsync(TimeSpan.FromSeconds(2));
        await service.StopAsync(CancellationToken.None);

        Assert.Equal(1, successfulTask.ExecutionCount);
    }

    [Fact]
    public async Task DisabledService_DoesNotExecuteTasks()
    {
        var task = new RecordingTask("disabled");
        var services = new ServiceCollection();
        services.AddScoped<IApplicationBackgroundTask>(_ => task);
        await using var provider = services.BuildServiceProvider();
        var service = CreateService(provider, enabled: false);

        await service.StartAsync(CancellationToken.None);
        await service.StopAsync(CancellationToken.None);

        Assert.Equal(0, task.ExecutionCount);
    }

    [Fact]
    public async Task StopAsync_CancelsRunningTaskGracefully()
    {
        var task = new CancellableTask();
        var services = new ServiceCollection();
        services.AddScoped<IApplicationBackgroundTask>(_ => task);
        await using var provider = services.BuildServiceProvider();
        var service = CreateService(provider, enabled: true);

        await service.StartAsync(CancellationToken.None);
        await task.Started.Task.WaitAsync(TimeSpan.FromSeconds(2));
        await service.StopAsync(CancellationToken.None);

        Assert.True(task.WasCancelled);
    }

    [Theory]
    [InlineData(-1, 60, 30)]
    [InlineData(30, 0, 30)]
    [InlineData(30, 60, 0)]
    [InlineData(3601, 60, 30)]
    [InlineData(30, 1441, 30)]
    [InlineData(30, 60, 366)]
    public async Task InvalidConfiguration_IsRejectedAtStartup(
        int initialDelaySeconds,
        int executionIntervalMinutes,
        int cartExpirationDays)
    {
        using var host = Host.CreateDefaultBuilder()
            .ConfigureLogging(logging => logging.ClearProviders())
            .ConfigureServices(services =>
            {
                services.AddOptions<BackgroundServiceOptions>()
                    .Configure(options =>
                    {
                        options.InitialDelaySeconds = initialDelaySeconds;
                        options.ExecutionIntervalMinutes = executionIntervalMinutes;
                        options.CartExpirationDays = cartExpirationDays;
                    })
                    .ValidateOnStart();
                services.AddSingleton<
                    IValidateOptions<BackgroundServiceOptions>,
                    BackgroundServiceOptionsValidator>();
            })
            .Build();

        await Assert.ThrowsAsync<OptionsValidationException>(
            () => host.StartAsync());
    }

    private static ApplicationBackgroundService CreateService(
        ServiceProvider provider,
        bool enabled) => new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new BackgroundServiceOptions
            {
                Enabled = enabled,
                InitialDelaySeconds = 0,
                ExecutionIntervalMinutes = 1,
                CartExpirationDays = 30
            }),
            new BackgroundMetricsStore(),
            NullLogger<ApplicationBackgroundService>.Instance);

    private sealed class RecordingTask(string name) : IApplicationBackgroundTask
    {
        public string Name { get; } = name;
        public int ExecutionCount { get; private set; }
        public TaskCompletionSource Executed { get; } = new(
            TaskCreationOptions.RunContinuationsAsynchronously);

        public Task ExecuteAsync(CancellationToken cancellationToken)
        {
            ExecutionCount++;
            Executed.TrySetResult();
            return Task.CompletedTask;
        }
    }

    private sealed class FailingTask : IApplicationBackgroundTask
    {
        public string Name => "failing";
        public Task ExecuteAsync(CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Expected test failure.");
    }

    private sealed class CancellableTask : IApplicationBackgroundTask
    {
        public string Name => "cancellable";
        public bool WasCancelled { get; private set; }
        public TaskCompletionSource Started { get; } = new(
            TaskCreationOptions.RunContinuationsAsynchronously);

        public async Task ExecuteAsync(CancellationToken cancellationToken)
        {
            Started.TrySetResult();
            try
            {
                await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                WasCancelled = true;
                throw;
            }
        }
    }
}
