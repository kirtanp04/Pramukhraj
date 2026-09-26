using System.ComponentModel.DataAnnotations;

namespace pramukhraj.Entities.EmailTemplates;

public sealed class EmailTemplate
{
    public Guid Id { get; set; }
    [MaxLength(100)] public string Key { get; set; } = string.Empty;
    [MaxLength(150)] public string Name { get; set; } = string.Empty;
    [MaxLength(500)] public string? Description { get; set; }
    public EmailTemplateCategory Category { get; set; }
    [MaxLength(300)] public string Subject { get; set; } = string.Empty;
    public string DesignJson { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
    public string? PlainTextContent { get; set; }
    public string VariablesJson { get; set; } = "[]";
    public string AttachmentsJson { get; set; } = "[]";
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime UpdatedOn { get; set; }
    [MaxLength(64), ConcurrencyCheck] public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString("N");
}

public enum EmailTemplateCategory
{
    Account = 1,
    Order = 2,
    Payment = 3,
    Shipping = 4,
    Marketing = 5,
    System = 6
}

public static class EmailTemplateKeys
{
    public const string Welcome = "WELCOME";
    public const string EmailVerificationOtp = "EMAIL_VERIFICATION_OTP";
    public const string OrderSuccess = "ORDER_SUCCESS";
    public const string PaymentSuccess = "PAYMENT_SUCCESS";
    public const string Invoice = "INVOICE";
    public const string Shipment = "SHIPMENT";
    public const string Delivered = "DELIVERED";
    public const string Cancelled = "ORDER_CANCELLED";
    public const string Refund = "REFUND_PROCESSED";
    public const string ReturnRequested = "RETURN_REQUESTED";
    public const string ReturnApproved = "RETURN_APPROVED";
    public const string ReturnRejected = "RETURN_REJECTED";
    public const string ReversePickupScheduled = "REVERSE_PICKUP_SCHEDULED";
    public const string ReturnPackageReceived = "RETURN_PACKAGE_RECEIVED";
    public const string ReplacementConfirmed = "REPLACEMENT_ORDER_CONFIRMED";
    public const string PasswordReset = "PASSWORD_RESET";
    public const string Newsletter = "NEWSLETTER";
    public const string SecurityAlert = "SECURITY_ALERT";
}
