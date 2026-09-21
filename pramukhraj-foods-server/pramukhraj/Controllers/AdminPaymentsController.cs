using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.Payment;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/payments")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminPaymentsController(IServiceManager serviceManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPayments(
        [FromQuery] AdminPaymentListRequest request,
        CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminPaymentService.GetPaymentsAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPaymentDetail(
        Guid id,
        CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminPaymentService.GetPaymentDetailAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}

