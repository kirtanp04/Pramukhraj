using System.ComponentModel.DataAnnotations;

namespace pramukhraj.Entities.Notifications;

public sealed class AdminNotification
{
    public Guid Id { get; set; }

    [MaxLength(100)]
    public string Type { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Severity { get; set; } = NotificationSeverities.Info;

    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? EntityType { get; set; }

    [MaxLength(100)]
    public string? EntityId { get; set; }

    [MaxLength(500)]
    public string? ActionUrl { get; set; }

    public string? MetadataJson { get; set; }

    public DateTime CreatedOn { get; set; }

    public ICollection<AdminNotificationRecipient> Recipients { get; set; } = [];
}

public sealed class AdminNotificationRecipient
{
    public Guid NotificationId { get; set; }
    public AdminNotification Notification { get; set; } = null!;

    [MaxLength(450)]
    public string AdminId { get; set; } = string.Empty;

    public DateTime? AcknowledgedOn { get; set; }
}

public static class AdminNotificationTypes
{
    public const string CustomerRegistered = "CUSTOMER_REGISTERED";
    public const string OrderPlaced = "ORDER_PLACED";
    public const string PaymentSucceeded = "PAYMENT_SUCCEEDED";
    public const string PaymentFailed = "PAYMENT_FAILED";
}

public static class NotificationSeverities
{
    public const string Info = "INFO";
    public const string Success = "SUCCESS";
    public const string Warning = "WARNING";
    public const string Error = "ERROR";
}
