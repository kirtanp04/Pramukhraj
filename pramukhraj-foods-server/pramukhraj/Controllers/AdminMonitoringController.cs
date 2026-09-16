using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Common;
using pramukhraj.DTOs.Monitoring;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/monitoring")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class AdminMonitoringController(IServiceManager serviceManager) : ControllerBase
{
    [HttpGet("background")]
    public IActionResult GetBackgroundMetrics() =>
        Ok(ApiResponse<BackgroundMetricsResponse>.Ok(
            serviceManager.MonitoringService.GetBackgroundMetrics(),
            "Background metrics retrieved successfully."));

    [HttpGet("server")]
    public async Task<IActionResult> GetServerMetrics(CancellationToken cancellationToken) =>
        Ok(ApiResponse<ServerMetricsResponse>.Ok(
            await serviceManager.MonitoringService.GetServerMetricsAsync(cancellationToken),
            "Server metrics retrieved successfully."));
}
