using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Order;

namespace pramukhraj.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/orders")]
[EnableRateLimiting("rate-limit")]
public sealed class PublicOrdersController(AppDbContext db) : ControllerBase
{
    [HttpGet("track")]
    public async Task<IActionResult> Track([FromQuery] string? query, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(ApiResponse<PublicOrderTrackingResponse>.Fail("Order number or AWB code is required.", 400));
        }

        var trimmed = query.Trim();
        var lower = trimmed.ToLower();
        var order = await db.Orders.AsNoTracking()
            .Include(x => x.Shipments)
                .ThenInclude(s => s.Activities)
            .Where(x => x.OrderNumber.ToLower() == lower
                     || x.Shipments.Any(s => s.AwbCode != null && s.AwbCode.ToLower() == lower))
            .OrderByDescending(x => x.CreatedOn)
            .FirstOrDefaultAsync(cancellationToken);

        if (order is null)
        {
            return NotFound(ApiResponse<PublicOrderTrackingResponse>.Fail("No order found matching the provided reference.", 404));
        }

        var shipment = order.Shipments.OrderByDescending(s => s.CreatedOn).FirstOrDefault();
        var activities = shipment?.Activities
            .OrderByDescending(a => a.Date)
            .Select(a => new CustomerShipmentActivityResponse(a.Activity, a.Location, a.Status, a.Date))
            .ToList() ?? [];

        var result = new PublicOrderTrackingResponse(
            order.OrderNumber,
            order.Status.ToString(),
            shipment?.Status.ToString(),
            shipment?.CourierName,
            shipment?.AwbCode,
            shipment?.TrackingUrl,
            shipment?.EstimatedDeliveryOn,
            shipment?.ShippedOn,
            shipment?.DeliveredOn,
            activities);

        return Ok(ApiResponse<PublicOrderTrackingResponse>.Ok(result, "Tracking details retrieved successfully."));
    }
}
