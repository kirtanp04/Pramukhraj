using System.ComponentModel.DataAnnotations;

namespace pramukhraj.Entities.Notifications;

public sealed class AdminNotification
{
    public Guid Id { get; set; }
    public long SequenceNumber { get; set; }
    [MaxLength(30)] public string Audience { get; set; } = "ADMIN";
    [MaxLength(450)] public string? TargetAdminId { get; set; }
    [MaxLength(100)] public string? TargetRole { get; set; } = "Admin";

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
    [MaxLength(250)] public string DeduplicationKey { get; set; } = string.Empty;
    public DateTime? ExpiresOn { get; set; }

    public ICollection<AdminNotificationRecipient> Recipients { get; set; } = [];
}

public sealed class AdminNotificationRecipient
{
    public Guid Id { get; set; }
    public Guid NotificationId { get; set; }
    public AdminNotification Notification { get; set; } = null!;

    [MaxLength(450)]
    public string AdminId { get; set; } = string.Empty;

    public DateTime? ReadOn { get; set; }
    public DateTime? DismissedOn { get; set; }
}

public static class AdminNotificationTypes
{
    public const string CustomerRegistered = "CUSTOMER_REGISTERED";
    public const string OrderPlaced = "ORDER_PLACED";
    public const string PaymentSucceeded = "PAYMENT_SUCCEEDED";
    public const string PaymentFailed = "PAYMENT_FAILED";
    public const string PaymentInitiated = "PAYMENT_INITIATED";
    public const string PaymentExpired = "PAYMENT_EXPIRED";
    public const string PaymentVerificationFailed = "PAYMENT_VERIFICATION_FAILED";
    public const string PaymentReconciliationRequired = "PAYMENT_RECONCILIATION_REQUIRED";
}

public static class NotificationSeverities
{
    public const string Info = "INFO";
    public const string Success = "SUCCESS";
    public const string Warning = "WARNING";
    public const string Error = "ERROR";
}
