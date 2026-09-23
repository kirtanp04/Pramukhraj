using System.Text.Json;
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
            using var doc = JsonDocument.Parse(body);
            var eventType = doc.RootElement.TryGetProperty("event", out var ev) ? ev.GetString() : null;

            if (eventType != null && eventType.StartsWith("refund.", StringComparison.OrdinalIgnoreCase))
            {
                var processed = await services.RefundService.HandleRazorpayRefundWebhookAsync(body, signature, token);
                return processed ? Ok(new { success = true }) : BadRequest(new { message = "Invalid webhook or unhandled refund event." });
            }

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
