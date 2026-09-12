using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/homepage-cms/customer")]
[AllowAnonymous]
[EnableRateLimiting("rate-limit")]
public sealed class CustomerHomepageCmsController : ControllerBase
{
    private readonly IServiceManager _serviceManager;

    public CustomerHomepageCmsController(IServiceManager serviceManager)
    {
        _serviceManager = serviceManager;
    }

    [HttpGet("hero")]
    public async Task<IActionResult> GetHero(CancellationToken cancellationToken)
    {
        var response = await _serviceManager.HomepageCmsService.GetCustomerHeroAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
