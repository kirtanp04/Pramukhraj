using System.Diagnostics;

namespace pramukhraj.Services;

public sealed class ServerMetricsSampler
{
    private readonly object _sync = new();
    private TimeSpan _lastProcessorTime = Process.GetCurrentProcess().TotalProcessorTime;
    private long _lastTimestamp = Stopwatch.GetTimestamp();

    public double SampleCpuUsagePercentage()
    {
        lock (_sync)
        {
            using var process = Process.GetCurrentProcess();
            process.Refresh();
            var currentTimestamp = Stopwatch.GetTimestamp();
            var currentProcessorTime = process.TotalProcessorTime;
            var elapsed = Stopwatch.GetElapsedTime(_lastTimestamp, currentTimestamp);
            var processorTime = currentProcessorTime - _lastProcessorTime;
            _lastTimestamp = currentTimestamp;
            _lastProcessorTime = currentProcessorTime;

            if (elapsed <= TimeSpan.Zero)
                return 0;

            var percentage = processorTime.TotalMilliseconds /
                elapsed.TotalMilliseconds /
                Math.Max(Environment.ProcessorCount, 1) * 100;
            return Math.Round(Math.Clamp(percentage, 0, 100), 2);
        }
    }
}
