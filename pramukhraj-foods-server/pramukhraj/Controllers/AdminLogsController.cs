using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.Logs;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/logs")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminLogsController(IServiceManager serviceManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetLogsChunk(
        [FromQuery] AdminLogQueryRequest request,
        CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminLogService.GetLogsChunkAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("files")]
    public async Task<IActionResult> GetAvailableLogFiles(CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminLogService.GetAvailableLogFilesAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("clear")]
    public async Task<IActionResult> ClearLogs(
        [FromBody] ClearLogsRequest request,
        CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminLogService.ClearLogsAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("download")]
    public async Task<IActionResult> DownloadLogFile(
        [FromQuery] string? date,
        CancellationToken cancellationToken)
    {
        var result = await serviceManager.AdminLogService.GetLogFileStreamAsync(date, cancellationToken);
        if (result is null)
        {
            return NotFound("Log file not found.");
        }

        return File(result.Value.Stream, result.Value.ContentType, result.Value.FileName);
    }
}

