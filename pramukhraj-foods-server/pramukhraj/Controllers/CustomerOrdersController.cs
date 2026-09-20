using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Common;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/customer/orders")]
[Authorize(AuthenticationSchemes = CustomerAuthenticationDefaults.AuthenticationScheme, Roles = "Customer",
    Policy = CustomerAuthenticationDefaults.VerifiedCustomerPolicy)]
[EnableRateLimiting("customer-checkout")]
public sealed class CustomerOrdersController(IServiceManager services) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null, CancellationToken token = default)
    {
        var response = await services.CustomerOrderService.GetCustomerOrdersAsync(page, pageSize, status, token);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{orderId:guid}")]
    public async Task<IActionResult> GetOrderDetail(Guid orderId, CancellationToken token)
    {
        var response = await services.CustomerOrderService.GetCustomerOrderDetailAsync(orderId, token);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{orderId:guid}/tracking")]
    public async Task<IActionResult> GetOrderTracking(Guid orderId, CancellationToken token)
    {
        var response = await services.CustomerOrderService.GetCustomerOrderTrackingAsync(orderId, token);
        return StatusCode(response.StatusCode, response);
    }
}

