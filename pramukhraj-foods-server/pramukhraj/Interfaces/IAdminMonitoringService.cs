using pramukhraj.DTOs.Monitoring;

namespace pramukhraj.Interfaces;

public interface IAdminMonitoringService
{
    BackgroundMetricsResponse GetBackgroundMetrics();
    Task<ServerMetricsResponse> GetServerMetricsAsync(CancellationToken cancellationToken);
}
