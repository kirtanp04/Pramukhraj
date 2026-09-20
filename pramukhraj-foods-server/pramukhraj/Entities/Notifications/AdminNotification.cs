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
    public const string ShipmentCreationSucceeded = "SHIPMENT_CREATION_SUCCEEDED";
    public const string ShipmentCreationFailed = "SHIPMENT_CREATION_FAILED";
    public const string CourierAssigned = "COURIER_ASSIGNED";
    public const string AwbAssigned = "AWB_ASSIGNED";
    public const string AwbAssignmentFailed = "AWB_ASSIGNMENT_FAILED";
    public const string PickupScheduled = "PICKUP_SCHEDULED";
    public const string PickupSchedulingFailed = "PICKUP_SCHEDULING_FAILED";
    public const string ShipmentPickedUp = "SHIPMENT_PICKED_UP";
    public const string ShipmentInTransit = "SHIPMENT_IN_TRANSIT";
    public const string ShipmentOutForDelivery = "SHIPMENT_OUT_FOR_DELIVERY";
    public const string ShipmentDelivered = "SHIPMENT_DELIVERED";
    public const string ShipmentDeliveryFailed = "SHIPMENT_DELIVERY_FAILED";
    public const string ShipmentDelayed = "SHIPMENT_DELAYED";
    public const string RtoInitiated = "RTO_INITIATED";
    public const string RtoDelivered = "RTO_DELIVERED";
    public const string ShiprocketWebhookFailed = "SHIPROCKET_WEBHOOK_FAILED";
}

public static class NotificationSeverities
{
    public const string Info = "INFO";
    public const string Success = "SUCCESS";
    public const string Warning = "WARNING";
    public const string Error = "ERROR";
}
