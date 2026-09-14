using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.DTOs.HomepageCms;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/homepage-cms")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminHomepageCmsController : ControllerBase
{
    private readonly IServiceManager _serviceManager;

    public AdminHomepageCmsController(IServiceManager serviceManager)
    {
        _serviceManager = serviceManager;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var response = await _serviceManager.HomepageCmsService.GetAdminAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost]
    public async Task<IActionResult> Replace(
        [FromBody] HomepageCmsWriteRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _serviceManager.HomepageCmsService.ReplaceAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
