using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.Settings;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/settings")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminStoreSettingsController(IServiceManager services) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var response = await services.StoreSettingsService.GetAdminAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] StoreSettingsWriteRequest request, CancellationToken cancellationToken)
    {
        var response = await services.StoreSettingsService.UpdateAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
