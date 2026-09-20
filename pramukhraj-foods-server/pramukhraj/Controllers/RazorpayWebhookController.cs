using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/webhooks/razorpay")]
[EnableRateLimiting("razorpay-webhook")]
public sealed class RazorpayWebhookController(IServiceManager services, ILogger<RazorpayWebhookController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Receive(CancellationToken token)
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync(token);
        var signature = Request.Headers["X-Razorpay-Signature"].ToString();
        if (string.IsNullOrWhiteSpace(body) || string.IsNullOrWhiteSpace(signature)) return BadRequest();
        try
        {
            await services.PaymentService.ProcessWebhookAsync(body, signature, token);
            return Ok();
        }
        catch (UnauthorizedAccessException) { return Unauthorized(); }
        catch (Exception exception)
        {
            logger.LogError(exception, "Razorpay webhook processing failed.");
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }
}
