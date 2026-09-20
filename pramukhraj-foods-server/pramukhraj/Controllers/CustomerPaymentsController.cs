using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Common;
using pramukhraj.DTOs.Order;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/customer/orders/{orderId:guid}")]
[Authorize(AuthenticationSchemes = CustomerAuthenticationDefaults.AuthenticationScheme, Roles = "Customer",
    Policy = CustomerAuthenticationDefaults.VerifiedCustomerPolicy)]
[EnableRateLimiting("customer-checkout")]
public sealed class CustomerPaymentsController(IServiceManager services) : ControllerBase
{
    [HttpGet("payment-status")]
    public async Task<IActionResult> Status(Guid orderId, CancellationToken token)
    {
        var response = await services.PaymentService.GetStatusAsync(orderId, token);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("payment/retry")]
    public async Task<IActionResult> Retry(Guid orderId, CancellationToken token)
    {
        var response = await services.PaymentService.RetryAsync(orderId, token);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("payment/verify")]
    public async Task<IActionResult> Verify(Guid orderId, [FromBody] VerifyRazorpayPaymentRequest request, CancellationToken token)
    {
        var response = await services.PaymentService.VerifyAsync(orderId, request, token);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("summary")]
    [HttpGet("pending-summary")]
    public async Task<IActionResult> PendingSummary(Guid orderId, CancellationToken token)
    {
        var response = await services.PaymentService.GetPendingSummaryAsync(orderId, token);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("cancel")]
    public async Task<IActionResult> Cancel(Guid orderId, CancellationToken token)
    {
        var response = await services.PaymentService.CancelPendingAsync(orderId, token);
        return StatusCode(response.StatusCode, response);
    }
}
