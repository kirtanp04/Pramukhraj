using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.Return;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/returns")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminReturnsController(IServiceManager services) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetReturns([FromQuery] AdminReturnFilterRequest filter, CancellationToken ct)
    {
        var response = await services.ReturnService.GetAdminReturnsAsync(filter, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{returnId:guid}")]
    public async Task<IActionResult> GetReturnDetails(Guid returnId, CancellationToken ct)
    {
        var response = await services.ReturnService.GetAdminReturnDetailsAsync(returnId, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("{returnId:guid}/approve")]
    public async Task<IActionResult> ApproveReturn(Guid returnId, [FromBody] AdminApproveReturnRequest request, CancellationToken ct)
    {
        var response = await services.ReturnService.ApproveReturnAsync(returnId, request, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("{returnId:guid}/reject")]
    public async Task<IActionResult> RejectReturn(Guid returnId, [FromBody] AdminRejectReturnRequest request, CancellationToken ct)
    {
        var response = await services.ReturnService.RejectReturnAsync(returnId, request, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("{returnId:guid}/inspect")]
    public async Task<IActionResult> InspectReturn(Guid returnId, [FromBody] AdminInspectReturnRequest request, CancellationToken ct)
    {
        var response = await services.ReturnService.InspectReturnAsync(returnId, request, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{returnId:guid}/couriers")]
    public async Task<IActionResult> GetCouriers(Guid returnId, CancellationToken ct)
    {
        var response = await services.ReturnService.GetReverseCouriersAsync(returnId, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("{returnId:guid}/schedule-pickup")]
    public async Task<IActionResult> SchedulePickup(Guid returnId, [FromBody] ScheduleReversePickupRequest request, CancellationToken ct)
    {
        var response = await services.ReturnService.SchedulePickupAsync(returnId, request, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("{returnId:guid}/book-pickup")]
    public async Task<IActionResult> BookPickup(Guid returnId, [FromBody] BookReversePickupRequest request, CancellationToken ct)
    {
        var response = await services.ReturnService.BookShiprocketReversePickupAsync(returnId, request, ct);
        return StatusCode(response.StatusCode, response);
    }


    [HttpPost("{returnId:guid}/update-tracking")]
    public async Task<IActionResult> UpdateTracking(Guid returnId, [FromBody] UpdateReverseTrackingRequest request, CancellationToken ct)
    {
        var response = await services.ReturnService.UpdateReverseTrackingStatusAsync(returnId, request, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("{returnId:guid}/process-refund")]
    public async Task<IActionResult> ProcessRefund(Guid returnId, [FromBody] AdminProcessRefundRequest request, CancellationToken ct)
    {
        var response = await services.RefundService.ProcessRefundAsync(returnId, request, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("{returnId:guid}/fulfill-replacement")]
    public async Task<IActionResult> FulfillReplacement(Guid returnId, [FromBody] AdminFulfillReplacementRequest request, CancellationToken ct)
    {
        var response = await services.ReturnService.FulfillReplacementOrderAsync(returnId, request, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportReturns([FromQuery] AdminReturnFilterRequest filter, CancellationToken ct)
    {
        var bytes = await services.ReturnService.ExportReturnsCsvAsync(filter, ct);
        var filename = $"returns-export-{DateTime.UtcNow:yyyyMMddHHmmss}.csv";
        return File(bytes, "text/csv; charset=utf-8", filename);
    }
}

