namespace pramukhraj.DTOs.Notifications;

public sealed record CreateAdminNotification(
    string Type,
    string Severity,
    string Title,
    string Message,
    string? EntityType = null,
    string? EntityId = null,
    string? ActionUrl = null,
    string? MetadataJson = null,
    string? DeduplicationKey = null,
    DateTime? ExpiresOn = null);

public sealed record AdminNotificationResponse(
    Guid Id,
    string Type,
    string Severity,
    string Title,
    string Message,
    string? EntityType,
    string? EntityId,
    string? ActionUrl,
    string? MetadataJson,
    DateTime CreatedOn,
    DateTime? AcknowledgedOn,
    long SequenceNumber = 0,
    DateTime? DismissedOn = null);

public sealed record AdminNotificationListResponse(
    IReadOnlyList<AdminNotificationResponse> Items,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int UnacknowledgedCount);
