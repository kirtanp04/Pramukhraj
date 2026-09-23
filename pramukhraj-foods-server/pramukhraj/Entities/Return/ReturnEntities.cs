using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Entities.Order;

namespace pramukhraj.Entities.Return;

[Index(nameof(ReturnNumber), IsUnique = true)]
[Index(nameof(OrderId))]
[Index(nameof(CustomerId), nameof(CreatedOn))]
[Index(nameof(Status))]
public sealed class ReturnRequest
{
    [Key]
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public Guid CustomerId { get; set; }

    [MaxLength(40)]
    public string ReturnNumber { get; set; } = string.Empty;

    public ReturnStatus Status { get; set; } = ReturnStatus.Requested;

    public ReturnReason Reason { get; set; } = ReturnReason.Other;

    public ReturnResolution Resolution { get; set; } = ReturnResolution.RefundToSource;

    [MaxLength(1000)]
    public string CustomerComments { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? AdminNotes { get; set; }

    [MaxLength(500)]
    public string? RejectionReason { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalRefundAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ReverseShippingDeduction { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal NetRefundAmount { get; set; }

    public DateTime CreatedOn { get; set; }

    public DateTime UpdatedOn { get; set; }

    public DateTime? ApprovedOn { get; set; }

    public DateTime? ReceivedOn { get; set; }

    public DateTime? InspectedOn { get; set; }

    public DateTime? CompletedOn { get; set; }

    [MaxLength(64), ConcurrencyCheck]
    public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString("N");

    public Order.Order Order { get; set; } = null!;

    public ICollection<ReturnItem> Items { get; set; } = [];

    public ICollection<ReturnMedia> Media { get; set; } = [];

    public ICollection<ReturnStatusHistory> StatusHistory { get; set; } = [];

    public RefundRecord? Refund { get; set; }
}

[Index(nameof(ReturnRequestId))]
[Index(nameof(OrderItemId))]
public sealed class ReturnItem
{
    [Key]
    public Guid Id { get; set; }

    public Guid ReturnRequestId { get; set; }

    public Guid OrderItemId { get; set; }

    public Guid ProductVariantId { get; set; }

    [MaxLength(255)]
    public string ProductName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string VariantName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RefundAmount { get; set; }

    public InspectionOutcome InspectionStatus { get; set; } = InspectionOutcome.Pending;

    public bool RestockInventory { get; set; } = true;

    public ReturnRequest ReturnRequest { get; set; } = null!;

    public OrderItem OrderItem { get; set; } = null!;
}

[Index(nameof(ReturnRequestId))]
public sealed class ReturnMedia
{
    [Key]
    public Guid Id { get; set; }

    public Guid ReturnRequestId { get; set; }

    [MaxLength(1000)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public DateTime CreatedOn { get; set; }

    public ReturnRequest ReturnRequest { get; set; } = null!;
}

[Index(nameof(ReturnRequestId), nameof(CreatedOn))]
public sealed class ReturnStatusHistory
{
    [Key]
    public Guid Id { get; set; }

    public Guid ReturnRequestId { get; set; }

    public ReturnStatus Status { get; set; }

    [MaxLength(1000)]
    public string? Note { get; set; }

    public Guid? ActorAdminId { get; set; }

    [MaxLength(150)]
    public string? ActorAdminName { get; set; }

    public DateTime CreatedOn { get; set; }

    public ReturnRequest ReturnRequest { get; set; } = null!;
}

[Index(nameof(ReturnRequestId), IsUnique = true)]
[Index(nameof(OrderId))]
[Index(nameof(PaymentId))]
[Index(nameof(IdempotencyKey), IsUnique = true)]
[Index(nameof(ProviderRefundId), IsUnique = true)]
public sealed class RefundRecord
{
    [Key]
    public Guid Id { get; set; }

    public Guid ReturnRequestId { get; set; }

    public Guid OrderId { get; set; }

    public Guid PaymentId { get; set; }

    [MaxLength(64)]
    public string IdempotencyKey { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ProviderRefundId { get; set; }

    public long AmountPaise { get; set; }

    [MaxLength(3)]
    public string Currency { get; set; } = "INR";

    public RefundStatus Status { get; set; } = RefundStatus.Pending;

    [MaxLength(50)]
    public string RefundSpeed { get; set; } = "normal";

    [MaxLength(1000)]
    public string? FailureReason { get; set; }

    public string? RawGatewayResponseJson { get; set; }

    public DateTime CreatedOn { get; set; }

    public DateTime? SettledOn { get; set; }

    public ReturnRequest ReturnRequest { get; set; } = null!;

    public Order.Order Order { get; set; } = null!;

    public Payment Payment { get; set; } = null!;
}

