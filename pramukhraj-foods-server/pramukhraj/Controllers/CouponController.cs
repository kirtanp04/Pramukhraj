using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.Coupon;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/coupons")]
[Authorize]
[EnableRateLimiting("rate-limit")]
public sealed class CouponController : ControllerBase
{
    private readonly IServiceManager _serviceManager;

    public CouponController(IServiceManager serviceManager)
    {
        _serviceManager = serviceManager;
    }

    [HttpPost]
    public async Task<IActionResult> CreateCoupon([FromBody] CreateCouponRequest request, CancellationToken cancellationToken)
    {
        var response = await _serviceManager.CouponService.CreateCouponAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet]
    public async Task<IActionResult> GetCouponList([FromQuery] CouponSearchRequest request, CancellationToken cancellationToken)
    {
        var response = await _serviceManager.CouponService.GetCouponListAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCouponById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _serviceManager.CouponService.GetCouponByIdAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCoupon(Guid id, [FromBody] UpdateCouponRequest request, CancellationToken cancellationToken)
    {
        var response = await _serviceManager.CouponService.UpdateCouponAsync(id, request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> ArchiveCoupon(Guid id, CancellationToken cancellationToken)
    {
        var response = await _serviceManager.CouponService.ArchiveCouponAsync(id, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
