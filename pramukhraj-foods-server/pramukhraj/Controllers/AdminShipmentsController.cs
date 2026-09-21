using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.Shipment;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/shipments")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminShipmentsController(IServiceManager serviceManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetShipments(
        [FromQuery] AdminShipmentListRequest request,
        CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminShipmentService.GetShipmentsAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetShipmentDetail(
        Guid id,
        CancellationToken cancellationToken)
    {
        var response = await serviceManager.AdminShipmentService.GetShipmentDetailAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}

