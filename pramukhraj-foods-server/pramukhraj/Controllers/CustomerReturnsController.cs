using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Common;
using pramukhraj.DTOs.Return;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/customer")]
[Authorize(AuthenticationSchemes = CustomerAuthenticationDefaults.AuthenticationScheme, Roles = "Customer",
    Policy = CustomerAuthenticationDefaults.VerifiedCustomerPolicy)]
[EnableRateLimiting("customer-checkout")]
public sealed class CustomerReturnsController(
    IServiceManager services,
    CustomerClaimsHelper claimsHelper) : ControllerBase
{
    [HttpGet("orders/{orderId:guid}/return-eligibility")]
    public async Task<IActionResult> GetOrderReturnEligibility(Guid orderId, CancellationToken ct)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null)
            return StatusCode(claims.StatusCode, claims);

        var response = await services.ReturnService.GetOrderReturnEligibilityAsync(orderId, claims.Data.CustomerId, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("orders/{orderId:guid}/returns")]
    public async Task<IActionResult> CreateReturn(Guid orderId, [FromBody] CreateReturnRequest request, CancellationToken ct)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null)
            return StatusCode(claims.StatusCode, claims);

        var response = await services.ReturnService.CreateReturnRequestAsync(orderId, claims.Data.CustomerId, request, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("returns")]
    public async Task<IActionResult> GetReturns([FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null)
            return StatusCode(claims.StatusCode, claims);

        var response = await services.ReturnService.GetCustomerReturnsAsync(claims.Data.CustomerId, page, pageSize, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("returns/{returnId:guid}")]
    public async Task<IActionResult> GetReturnDetails(Guid returnId, CancellationToken ct)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null)
            return StatusCode(claims.StatusCode, claims);

        var response = await services.ReturnService.GetCustomerReturnDetailsAsync(returnId, claims.Data.CustomerId, ct);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("returns/{returnId:guid}/cancel")]
    public async Task<IActionResult> CancelReturn(Guid returnId, CancellationToken ct)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null)
            return StatusCode(claims.StatusCode, claims);

        var response = await services.ReturnService.CancelReturnRequestAsync(returnId, claims.Data.CustomerId, ct);
        return StatusCode(response.StatusCode, response);
    }
}

