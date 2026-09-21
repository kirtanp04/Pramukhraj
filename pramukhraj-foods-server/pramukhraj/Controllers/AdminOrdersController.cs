using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.Order;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminOrdersController(IServiceManager serviceManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] AdminOrderListRequest request,
        CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminOrderService.GetOrdersAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrderDetail(
        Guid id,
        CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminOrderService.GetOrderDetailAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}

