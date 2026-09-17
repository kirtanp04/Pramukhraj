using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Common;
using pramukhraj.DTOs.Customer;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/customer/account/verification")]
[Authorize(AuthenticationSchemes = CustomerAuthenticationDefaults.AuthenticationScheme, Roles = "Customer")]
public sealed class CustomerVerificationController(IServiceManager serviceManager) : ControllerBase
{
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerVerificationService.GetStatusAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("mobile/request")]
    [EnableRateLimiting("customer-verification-send")]
    public async Task<IActionResult> RequestMobile(CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerVerificationService.RequestMobileCodeAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("mobile/verify")]
    [EnableRateLimiting("customer-verification-verify")]
    public async Task<IActionResult> VerifyMobile([FromBody] VerifyContactCodeRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerVerificationService.VerifyMobileCodeAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPatch("email")]
    public async Task<IActionResult> UpdateEmail([FromBody] UpdateCustomerEmailRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerVerificationService.UpdateEmailAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("email/request")]
    [EnableRateLimiting("customer-verification-send")]
    public async Task<IActionResult> RequestEmail(CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerVerificationService.RequestEmailCodeAsync(cancellationToken);
        return StatusCode(response.StatusCode, response);
    }

    [HttpPost("email/verify")]
    [EnableRateLimiting("customer-verification-verify")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyContactCodeRequest request, CancellationToken cancellationToken)
    {
        var response = await serviceManager.CustomerVerificationService.VerifyEmailCodeAsync(request, cancellationToken);
        return StatusCode(response.StatusCode, response);
    }
}
