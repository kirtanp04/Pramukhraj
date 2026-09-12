using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/faqs/customer")]
[AllowAnonymous]
[EnableRateLimiting("rate-limit")]
public sealed class CustomerFaqController : ControllerBase
{
    private readonly IServiceManager _serviceManager;

    public CustomerFaqController(IServiceManager serviceManager)
    {
        _serviceManager = serviceManager;
    }

    [HttpGet("home")]
    public async Task<IActionResult> GetHomeFaqs(CancellationToken cancellationToken)
    {
        var response = await _serviceManager.FaqService.GetCustomerHomeFaqsAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
