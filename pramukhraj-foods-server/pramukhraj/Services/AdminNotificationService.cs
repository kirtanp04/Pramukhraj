using Microsoft.EntityFrameworkCore;
using pramukhraj.Database;
using pramukhraj.DTOs.Notifications;
using pramukhraj.Entities.Notifications;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class AdminNotificationService(
    AppDbContext db,
    AdminNotificationStreamHub streamHub,
    ILogger<AdminNotificationService> logger,
    IAdminNotificationBackplane? backplane = null) : IAdminNotificationService
{
    public async Task<AdminNotificationResponse?> CreateAsync(
        CreateAdminNotification request,
        bool publishImmediately = true,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        Validate(request);

        var adminIds = await db.Users.AsNoTracking()
            .Where(user => !user.IsDeleted)
            .Select(user => user.Id)
            .ToListAsync(cancellationToken);
        if (adminIds.Count == 0)
        {
            logger.LogWarning("Notification {Type} was not created because there are no active administrators.", request.Type);
            return null;
        }

        var notification = new AdminNotification
        {
            Id = Guid.NewGuid(),
            Type = request.Type.Trim().ToUpperInvariant(),
            Severity = request.Severity.Trim().ToUpperInvariant(),
            Title = request.Title.Trim(),
            Message = request.Message.Trim(),
            EntityType = NullIfWhiteSpace(request.EntityType),
            EntityId = NullIfWhiteSpace(request.EntityId),
            ActionUrl = NullIfWhiteSpace(request.ActionUrl),
            MetadataJson = NullIfWhiteSpace(request.MetadataJson),
            CreatedOn = DateTime.UtcNow,
            Recipients = adminIds.Select(adminId => new AdminNotificationRecipient { AdminId = adminId }).ToList()
        };

        db.AdminNotifications.Add(notification);
        await db.SaveChangesAsync(cancellationToken);
        var response = ToResponse(notification, null);
        if (publishImmediately)
        {
            streamHub.Publish(response, adminIds.ToHashSet(StringComparer.Ordinal));
            if (backplane is not null) await backplane.PublishAsync(response.Id, cancellationToken);
        }
        return response;
    }

    public async Task<AdminNotificationListResponse> GetForAdminAsync(
        string adminId,
        int pageNumber,
        int pageSize,
        bool onlyUnacknowledged,
        CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = db.AdminNotificationRecipients.AsNoTracking().Where(item => item.AdminId == adminId);
        var unacknowledgedCount = await query.CountAsync(item => item.AcknowledgedOn == null, cancellationToken);
        if (onlyUnacknowledged) query = query.Where(item => item.AcknowledgedOn == null);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(item => item.Notification.CreatedOn)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(item => new AdminNotificationResponse(
                item.Notification.Id,
                item.Notification.Type,
                item.Notification.Severity,
                item.Notification.Title,
                item.Notification.Message,
                item.Notification.EntityType,
                item.Notification.EntityId,
                item.Notification.ActionUrl,
                item.Notification.MetadataJson,
                item.Notification.CreatedOn,
                item.AcknowledgedOn))
            .ToListAsync(cancellationToken);
        return new AdminNotificationListResponse(items, pageNumber, pageSize, totalCount, unacknowledgedCount);
    }

    public async Task<bool> AcknowledgeAsync(string adminId, Guid notificationId, CancellationToken cancellationToken = default)
    {
        var updated = await db.AdminNotificationRecipients
            .Where(item => item.AdminId == adminId && item.NotificationId == notificationId && item.AcknowledgedOn == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.AcknowledgedOn, DateTime.UtcNow), cancellationToken);
        return updated > 0;
    }

    public Task<int> AcknowledgeAllAsync(string adminId, CancellationToken cancellationToken = default) =>
        db.AdminNotificationRecipients
            .Where(item => item.AdminId == adminId && item.AcknowledgedOn == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.AcknowledgedOn, DateTime.UtcNow), cancellationToken);

    public async Task PublishAsync(AdminNotificationResponse notification, CancellationToken cancellationToken = default)
    {
        var recipients = await db.AdminNotificationRecipients.AsNoTracking()
            .Where(item => item.NotificationId == notification.Id)
            .Select(item => item.AdminId)
            .ToListAsync(cancellationToken);
        streamHub.Publish(notification, recipients.ToHashSet(StringComparer.Ordinal));
        if (backplane is not null) await backplane.PublishAsync(notification.Id, cancellationToken);
    }

    public AdminNotificationSubscription Subscribe(string adminId) => streamHub.Subscribe(adminId);

    private static AdminNotificationResponse ToResponse(AdminNotification item, DateTime? acknowledgedOn) =>
        new(item.Id, item.Type, item.Severity, item.Title, item.Message, item.EntityType, item.EntityId,
            item.ActionUrl, item.MetadataJson, item.CreatedOn, acknowledgedOn);

    private static void Validate(CreateAdminNotification request)
    {
        if (string.IsNullOrWhiteSpace(request.Type) || request.Type.Length > 100) throw new ArgumentException("A valid notification type is required.");
        if (string.IsNullOrWhiteSpace(request.Severity) || request.Severity.Length > 30) throw new ArgumentException("A valid notification severity is required.");
        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Length > 200) throw new ArgumentException("A valid notification title is required.");
        if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Length > 1000) throw new ArgumentException("A valid notification message is required.");
        if (request.ActionUrl?.Length > 500
            || (request.ActionUrl is not null
                && (!request.ActionUrl.StartsWith('/')
                    || request.ActionUrl.StartsWith("//", StringComparison.Ordinal)
                    || request.ActionUrl.Contains('\\')
                    || request.ActionUrl.Any(char.IsControl))))
            throw new ArgumentException("Notification action URLs must be safe local application paths.");
    }

    private static string? NullIfWhiteSpace(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
