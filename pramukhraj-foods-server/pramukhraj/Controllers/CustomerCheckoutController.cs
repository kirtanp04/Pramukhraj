using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Common;
using pramukhraj.DTOs.Checkout;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/customer/checkout")]
[Authorize(
    AuthenticationSchemes = CustomerAuthenticationDefaults.AuthenticationScheme,
    Roles = "Customer",
    Policy = CustomerAuthenticationDefaults.VerifiedCustomerPolicy)]
[EnableRateLimiting("customer-checkout")]
public sealed class CustomerCheckoutController(IServiceManager serviceManager) : ControllerBase
{
    [HttpPost("sessions")]
    public async Task<IActionResult> Initialize([FromBody] InitializeCheckoutRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CheckoutService.InitializeAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("sessions/{checkoutSessionId:guid}")]
    public async Task<IActionResult> Get(Guid checkoutSessionId, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CheckoutService.GetAsync(checkoutSessionId, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPatch("sessions/{checkoutSessionId:guid}/address")]
    public async Task<IActionResult> UpdateAddress(Guid checkoutSessionId, [FromBody] UpdateCheckoutAddressRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CheckoutService.UpdateAddressAsync(checkoutSessionId, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPut("sessions/{checkoutSessionId:guid}/coupon")]
    public async Task<IActionResult> ApplyCoupon(Guid checkoutSessionId, [FromBody] ApplyCheckoutCouponRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CheckoutService.ApplyCouponAsync(checkoutSessionId, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpDelete("sessions/{checkoutSessionId:guid}/coupon")]
    public async Task<IActionResult> RemoveCoupon(Guid checkoutSessionId, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CheckoutService.RemoveCouponAsync(checkoutSessionId, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("sessions/{checkoutSessionId:guid}/refresh")]
    public async Task<IActionResult> Refresh(Guid checkoutSessionId, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CheckoutService.RefreshAsync(checkoutSessionId, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
