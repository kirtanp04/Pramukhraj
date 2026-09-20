using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/webhooks/shipping")]
[EnableRateLimiting("shiprocket-webhook")]
public sealed class ShiprocketWebhookController(IServiceManager services, ILogger<ShiprocketWebhookController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Receive(CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync(cancellationToken);

        var token = Request.Headers["x-api-key"].ToString();
        if (string.IsNullOrWhiteSpace(token))
        {
            token = Request.Headers["X-Shiprocket-Token"].ToString();
        }
        if (string.IsNullOrWhiteSpace(token))
        {
            token = Request.Headers["Authorization"].ToString();
        }

        if (string.IsNullOrWhiteSpace(body))
        {
            return BadRequest(new { message = "Request body cannot be empty." });
        }

        try
        {
            var processed = await services.ShiprocketFulfillmentService.ProcessWebhookAsync(body, token, cancellationToken);
            return Ok(new { success = true, processed });
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Shiprocket webhook processing failed.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Webhook processing failed." });
        }
    }
}

