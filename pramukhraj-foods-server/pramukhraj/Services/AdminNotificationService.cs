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

        var deduplicationKey = string.IsNullOrWhiteSpace(request.DeduplicationKey)
            ? $"{request.Type.Trim().ToLowerInvariant()}:{request.EntityId ?? Guid.NewGuid().ToString("N")}" : request.DeduplicationKey.Trim();
        var existing = await db.AdminNotifications.AsNoTracking().FirstOrDefaultAsync(x => x.DeduplicationKey == deduplicationKey, cancellationToken);
        if (existing is not null) return ToResponse(existing, null);

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
            DeduplicationKey = deduplicationKey,
            ExpiresOn = request.ExpiresOn,
            CreatedOn = DateTime.UtcNow,
            Recipients = adminIds.Select(adminId => new AdminNotificationRecipient { Id = Guid.NewGuid(), AdminId = adminId }).ToList()
        };

        // PostgreSQL assigns this atomically from AdminNotificationSequence.
        // SQLite is used by the test suite and has no sequence support.
        if (!db.Database.IsNpgsql())
            notification.SequenceNumber = (await db.AdminNotifications.MaxAsync(x => (long?)x.SequenceNumber, cancellationToken) ?? 0L) + 1L;

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
        var query = db.AdminNotificationRecipients.AsNoTracking().Where(item => item.AdminId == adminId && item.DismissedOn == null && (item.Notification.ExpiresOn == null || item.Notification.ExpiresOn > DateTime.UtcNow));
        var unacknowledgedCount = await query.CountAsync(item => item.ReadOn == null, cancellationToken);
        if (onlyUnacknowledged) query = query.Where(item => item.ReadOn == null);
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
                item.ReadOn, item.Notification.SequenceNumber, item.DismissedOn))
            .ToListAsync(cancellationToken);
        return new AdminNotificationListResponse(items, pageNumber, pageSize, totalCount, unacknowledgedCount);
    }

    public async Task<bool> AcknowledgeAsync(string adminId, Guid notificationId, CancellationToken cancellationToken = default)
    {
        var updated = await db.AdminNotificationRecipients
            .Where(item => item.AdminId == adminId && item.NotificationId == notificationId && item.ReadOn == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.ReadOn, DateTime.UtcNow), cancellationToken);
        return updated > 0;
    }

    public Task<int> AcknowledgeAllAsync(string adminId, CancellationToken cancellationToken = default) =>
        db.AdminNotificationRecipients
            .Where(item => item.AdminId == adminId && item.ReadOn == null && item.DismissedOn == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(item => item.ReadOn, DateTime.UtcNow), cancellationToken);

    public Task<int> GetUnreadCountAsync(string adminId, CancellationToken cancellationToken = default) =>
        db.AdminNotificationRecipients.CountAsync(x => x.AdminId == adminId && x.ReadOn == null && x.DismissedOn == null &&
            (x.Notification.ExpiresOn == null || x.Notification.ExpiresOn > DateTime.UtcNow), cancellationToken);

    public async Task<bool> DismissAsync(string adminId, Guid notificationId, CancellationToken cancellationToken = default) =>
        await db.AdminNotificationRecipients.Where(x => x.AdminId == adminId && x.NotificationId == notificationId && x.DismissedOn == null)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.DismissedOn, DateTime.UtcNow).SetProperty(x => x.ReadOn, x => x.ReadOn ?? DateTime.UtcNow), cancellationToken) > 0;

    public Task<IReadOnlyList<AdminNotificationResponse>> ReplayAsync(string adminId, long afterSequenceNumber, int limit, CancellationToken cancellationToken = default) =>
        db.AdminNotificationRecipients.AsNoTracking().Where(x => x.AdminId == adminId && x.DismissedOn == null && x.Notification.SequenceNumber > afterSequenceNumber)
            .OrderBy(x => x.Notification.SequenceNumber).Take(Math.Clamp(limit, 1, 200))
            .Select(x => new AdminNotificationResponse(x.Notification.Id, x.Notification.Type, x.Notification.Severity, x.Notification.Title,
                x.Notification.Message, x.Notification.EntityType, x.Notification.EntityId, x.Notification.ActionUrl, x.Notification.MetadataJson,
                x.Notification.CreatedOn, x.ReadOn, x.Notification.SequenceNumber, x.DismissedOn)).ToListAsync(cancellationToken).ContinueWith<IReadOnlyList<AdminNotificationResponse>>(x => x.Result, cancellationToken);

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
            item.ActionUrl, item.MetadataJson, item.CreatedOn, acknowledgedOn, item.SequenceNumber);

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
