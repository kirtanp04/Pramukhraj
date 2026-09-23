using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Common;
using pramukhraj.DTOs.Sales;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/sales")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminSalesController(IServiceManager serviceManager) : ControllerBase
{
    [HttpGet("report")]
    public async Task<IActionResult> GetSalesReport(
        [FromQuery] AdminSalesReportRequest request,
        CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminSalesService.GetSalesReportAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("export")]
    [SkipEncryption]
    public async Task<IActionResult> ExportSalesReport(
        [FromQuery] AdminSalesReportRequest request,
        CancellationToken cancellationToken)
    {
        if (string.Equals(request.Format, "csv", StringComparison.OrdinalIgnoreCase))
        {
            var (csvBytes, fileName) = await serviceManager.AdminSalesService.ExportSalesReportCsvAsync(request, cancellationToken);
            return File(csvBytes, "text/csv; charset=utf-8", fileName);
        }

        var (excelBytes, excelFileName) = await serviceManager.AdminSalesService.ExportSalesReportExcelAsync(request, cancellationToken);
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelFileName);
    }

    [HttpPost("clear-cache")]
    public IActionResult ClearSalesCache()
    {
        serviceManager.AdminSalesService.InvalidateSalesCache("Admin manually cleared sales cache");
        return Ok(ApiResponse<string>.Ok("Sales reports cache cleared successfully."));
    }
}

