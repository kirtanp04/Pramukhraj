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

    [HttpPost("{returnId:guid}/process-refund")]
    public async Task<IActionResult> ProcessRefund(Guid returnId, [FromBody] AdminProcessRefundRequest request, CancellationToken ct)
    {
        var response = await services.RefundService.ProcessRefundAsync(returnId, request, ct);
        return StatusCode(response.StatusCode, response);
    }
}

