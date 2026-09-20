using System.Text.Json;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Common;
using pramukhraj.Entities;
using pramukhraj.Interfaces;

namespace pramukhraj.Controllers;

[ApiController]
[Route("api/admin/notifications")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("rate-limit")]
public sealed class AdminNotificationsController(IServiceManager serviceManager) : ControllerBase
{
    private IAdminNotificationService Notifications => serviceManager.AdminNotificationService;
    private static readonly JsonSerializerOptions StreamJsonOptions = new(JsonSerializerDefaults.Web);

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool onlyUnacknowledged = false,
        CancellationToken cancellationToken = default)
    {
        var adminId = GetAdminId();
        if (adminId is null) return Unauthorized(ApiResponse<object>.Fail("Authenticated administrator information was not found.", 401));
        var result = await Notifications.GetForAdminAsync(adminId, pageNumber, pageSize, onlyUnacknowledged, cancellationToken);
        return Ok(ApiResponse<object>.Ok(result, "Notifications retrieved successfully."));
    }

    [HttpPost("{notificationId:guid}/acknowledge")]
    public async Task<IActionResult> Acknowledge(Guid notificationId, CancellationToken cancellationToken)
    {
        var adminId = GetAdminId();
        if (adminId is null) return Unauthorized(ApiResponse<object>.Fail("Authenticated administrator information was not found.", 401));
        var changed = await Notifications.AcknowledgeAsync(adminId, notificationId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { changed }, changed ? "Notification acknowledged." : "Notification was already acknowledged."));
    }

    [HttpPost("acknowledge-all")]
    public async Task<IActionResult> AcknowledgeAll(CancellationToken cancellationToken)
    {
        var adminId = GetAdminId();
        if (adminId is null) return Unauthorized(ApiResponse<object>.Fail("Authenticated administrator information was not found.", 401));
        var count = await Notifications.AcknowledgeAllAsync(adminId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { count }, "Notifications acknowledged successfully."));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken cancellationToken)
    {
        var adminId = GetAdminId();
        if (adminId is null) return Unauthorized(ApiResponse<object>.Fail("Authenticated administrator information was not found.", 401));
        return Ok(ApiResponse<object>.Ok(new { count = await Notifications.GetUnreadCountAsync(adminId, cancellationToken) }));
    }

    [HttpPatch("{notificationId:guid}/read")]
    public async Task<IActionResult> Read(Guid notificationId, CancellationToken cancellationToken) =>
        await Acknowledge(notificationId, cancellationToken);

    [HttpPatch("read-all")]
    public async Task<IActionResult> ReadAll(CancellationToken cancellationToken) =>
        await AcknowledgeAll(cancellationToken);

    [HttpPatch("{notificationId:guid}/dismiss")]
    public async Task<IActionResult> Dismiss(Guid notificationId, CancellationToken cancellationToken)
    {
        var adminId = GetAdminId();
        if (adminId is null) return Unauthorized(ApiResponse<object>.Fail("Authenticated administrator information was not found.", 401));
        var changed = await Notifications.DismissAsync(adminId, notificationId, cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { changed }, changed ? "Notification dismissed." : "Notification was already dismissed."));
    }

    [HttpGet("stream")]
    [EnableRateLimiting("admin-notification-stream")]
    public async Task Stream([FromQuery] long? afterSequenceNumber, CancellationToken cancellationToken)
    {
        var adminId = GetAdminId();
        if (adminId is null)
        {
            Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }

        Response.StatusCode = StatusCodes.Status200OK;
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache, no-store, no-transform";
        Response.Headers["X-Accel-Buffering"] = "no";
        Response.Headers.Connection = "keep-alive";
        using var subscription = Notifications.Subscribe(adminId);
        using var streamLifetime = CreateStreamLifetime(cancellationToken);
        var streamCancellationToken = streamLifetime.Token;

        // The first write commits the response headers. Avoid StartAsync here:
        // some hosts/proxies do not support explicitly starting the response,
        // while WriteAsync + FlushAsync works consistently for SSE.
        await Response.WriteAsync(": connected\n\n", streamCancellationToken);
        var lastEventId = afterSequenceNumber ?? ParseSequence(Request.Headers["Last-Event-ID"].ToString());
        if (lastEventId > 0)
        {
            var replay = await Notifications.ReplayAsync(adminId, lastEventId, 200, streamCancellationToken);
            foreach (var item in replay)
            {
                var replayJson = JsonSerializer.Serialize(item, StreamJsonOptions);
                await Response.WriteAsync($"id: {item.SequenceNumber}\nevent: admin-notification\ndata: {replayJson}\n\n", streamCancellationToken);
            }
        }
        await Response.Body.FlushAsync(streamCancellationToken);

        try
        {
            while (!streamCancellationToken.IsCancellationRequested)
            {
                using var readTimeout = CancellationTokenSource.CreateLinkedTokenSource(streamCancellationToken);
                readTimeout.CancelAfter(TimeSpan.FromSeconds(15));
                try
                {
                    var notification = await subscription.Reader.ReadAsync(readTimeout.Token);
                    var json = JsonSerializer.Serialize(notification, StreamJsonOptions);
                    await Response.WriteAsync($"id: {notification.SequenceNumber}\nevent: admin-notification\ndata: {json}\n\n", streamCancellationToken);
                    while (subscription.Reader.TryRead(out var queuedNotification))
                    {
                        var queuedJson = JsonSerializer.Serialize(queuedNotification, StreamJsonOptions);
                        await Response.WriteAsync($"id: {queuedNotification.SequenceNumber}\nevent: admin-notification\ndata: {queuedJson}\n\n", streamCancellationToken);
                    }
                }
                catch (OperationCanceledException) when (!streamCancellationToken.IsCancellationRequested)
                {
                    await Response.WriteAsync(": heartbeat\n\n", streamCancellationToken);
                }
                await Response.Body.FlushAsync(streamCancellationToken);
            }
        }
        catch (OperationCanceledException) when (streamCancellationToken.IsCancellationRequested) { }
    }

    private CancellationTokenSource CreateStreamLifetime(CancellationToken requestCancellationToken)
    {
        var lifetime = CancellationTokenSource.CreateLinkedTokenSource(requestCancellationToken, HttpContext.RequestAborted);
        var maximumLifetime = TimeSpan.FromMinutes(5);
        var expirationValue = User.FindFirst(JwtRegisteredClaimNames.Exp)?.Value;
        if (long.TryParse(expirationValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var expirationSeconds))
        {
            var untilTokenExpires = DateTimeOffset.FromUnixTimeSeconds(expirationSeconds) - DateTimeOffset.UtcNow;
            maximumLifetime = untilTokenExpires < maximumLifetime ? untilTokenExpires : maximumLifetime;
        }

        lifetime.CancelAfter(maximumLifetime > TimeSpan.Zero ? maximumLifetime : TimeSpan.FromMilliseconds(1));
        return lifetime;
    }

    private string? GetAdminId() => HttpContext.Items.TryGetValue("UserInfo", out var value) && value is ApplicationUser user
        ? user.Id
        : null;

    private static long ParseSequence(string value) => long.TryParse(value, out var result) && result > 0 ? result : 0;
}
