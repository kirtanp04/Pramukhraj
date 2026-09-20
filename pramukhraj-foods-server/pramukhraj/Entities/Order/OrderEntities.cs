using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace pramukhraj.Entities.Order;

public enum OrderStatus { PendingPayment = 1, Confirmed = 2, PaymentFailed = 3, Cancelled = 4, Expired = 5 }
public enum PaymentStatus { Pending = 1, ProviderOrderCreated = 2, Paid = 3, Failed = 4, Expired = 5, VerificationFailed = 6 }
public enum InventoryReservationStatus { Reserved = 1, Completed = 2, Released = 3 }
public enum OutboxStatus { Pending = 1, Processing = 2, Completed = 3, Failed = 4 }

[Index(nameof(OrderNumber), IsUnique = true)]
[Index(nameof(IdempotencyKey), IsUnique = true)]
[Index(nameof(CheckoutSessionId), IsUnique = true)]
[Index(nameof(CustomerId), nameof(CreatedOn))]
public sealed class Order
{
    [Key] public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid CheckoutSessionId { get; set; }
    [MaxLength(40)] public string OrderNumber { get; set; } = string.Empty;
    [MaxLength(64)] public string IdempotencyKey { get; set; } = string.Empty;
    public OrderStatus Status { get; set; } = OrderStatus.PendingPayment;
    [MaxLength(500)] public string? CustomerNote { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Subtotal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal ItemDiscountAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal CouponDiscountAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal TaxAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal ProductTaxAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal PaymentServiceTaxAmount { get; set; }
    [Column(TypeName = "decimal(8,2)")] public decimal ProductTaxRatePercent { get; set; }
    [Column(TypeName = "decimal(8,2)")] public decimal PaymentServiceTaxRatePercent { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal ShippingAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal ProviderShippingCost { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal GrandTotal { get; set; }
    [MaxLength(3)] public string Currency { get; set; } = "INR";
    public Guid? CouponId { get; set; }
    [MaxLength(50)] public string? CouponCode { get; set; }
    public int? SelectedCourierId { get; set; }
    [MaxLength(200)] public string? SelectedCourierName { get; set; }
    public DateTime? EstimatedDeliveryOn { get; set; }
    public DateTime PaymentExpiresOn { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime UpdatedOn { get; set; }
    [MaxLength(64), ConcurrencyCheck] public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString("N");
    public ICollection<OrderItem> Items { get; set; } = [];
    public ICollection<OrderAddress> Addresses { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
}

public sealed class OrderItem
{
    [Key] public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public Guid ProductVariantId { get; set; }
    [MaxLength(255)] public string ProductName { get; set; } = string.Empty;
    [MaxLength(255)] public string ProductSlug { get; set; } = string.Empty;
    [MaxLength(255)] public string VariantName { get; set; } = string.Empty;
    [MaxLength(100)] public string Sku { get; set; } = string.Empty;
    [MaxLength(30)] public string? HsnCode { get; set; }
    [Column(TypeName = "decimal(10,3)")] public decimal Weight { get; set; }
    [MaxLength(20)] public string WeightUnit { get; set; } = string.Empty;
    public int Quantity { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal UnitPrice { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal UnitMrp { get; set; }
    [Column(TypeName = "decimal(8,2)")] public decimal TaxPercentage { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal TaxableAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal DiscountAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal TaxAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal LineTotal { get; set; }
    public Order Order { get; set; } = null!;
}

public sealed class OrderAddress
{
    [Key] public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    [MaxLength(20)] public string Type { get; set; } = string.Empty;
    [MaxLength(120)] public string RecipientName { get; set; } = string.Empty;
    [MaxLength(16)] public string MobileNumber { get; set; } = string.Empty;
    [MaxLength(256)] public string? Email { get; set; }
    [MaxLength(250)] public string AddressLine1 { get; set; } = string.Empty;
    [MaxLength(250)] public string? AddressLine2 { get; set; }
    [MaxLength(150)] public string? Landmark { get; set; }
    [MaxLength(100)] public string City { get; set; } = string.Empty;
    [MaxLength(100)] public string State { get; set; } = string.Empty;
    [MaxLength(10)] public string PostalCode { get; set; } = string.Empty;
    [MaxLength(80)] public string Country { get; set; } = string.Empty;
    public Order Order { get; set; } = null!;
}

public sealed class OrderStatusHistory
{
    [Key] public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public OrderStatus Status { get; set; }
    [MaxLength(500)] public string? Note { get; set; }
    public DateTime CreatedOn { get; set; }
}

[Index(nameof(IdempotencyKey), IsUnique = true)]
[Index(nameof(ProviderOrderId), IsUnique = true)]
[Index(nameof(ProviderPaymentId), IsUnique = true)]
public sealed class Payment
{
    [Key] public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    [MaxLength(64)] public string IdempotencyKey { get; set; } = string.Empty;
    [MaxLength(100)] public string? ProviderOrderId { get; set; }
    [MaxLength(100)] public string? ProviderPaymentId { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public long AmountPaise { get; set; }
    [MaxLength(3)] public string Currency { get; set; } = "INR";
    [MaxLength(1000)] public string? LastError { get; set; }
    public DateTime ExpiresOn { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime UpdatedOn { get; set; }
    public DateTime? PaidOn { get; set; }
    [MaxLength(64), ConcurrencyCheck] public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString("N");
    public Order Order { get; set; } = null!;
}

public sealed class PaymentTransaction
{
    [Key] public Guid Id { get; set; }
    public Guid PaymentId { get; set; }
    [MaxLength(50)] public string Type { get; set; } = string.Empty;
    [MaxLength(100)] public string? ProviderReference { get; set; }
    [MaxLength(30)] public string Status { get; set; } = string.Empty;
    public string? SafePayloadJson { get; set; }
    public DateTime CreatedOn { get; set; }
}

[Index(nameof(OrderId), nameof(ProductVariantId), IsUnique = true)]
public sealed class InventoryReservation
{
    [Key] public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid ProductVariantId { get; set; }
    public int Quantity { get; set; }
    public InventoryReservationStatus Status { get; set; } = InventoryReservationStatus.Reserved;
    public DateTime ExpiresOn { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? CompletedOn { get; set; }
    public DateTime? ReleasedOn { get; set; }
}

[Index(nameof(Provider), nameof(ProviderEventId), IsUnique = true)]
public sealed class WebhookInboxEvent
{
    [Key] public Guid Id { get; set; }
    [MaxLength(30)] public string Provider { get; set; } = string.Empty;
    [MaxLength(150)] public string ProviderEventId { get; set; } = string.Empty;
    [MaxLength(80)] public string EventType { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = "{}";
    public DateTime ReceivedOn { get; set; }
    public DateTime? ProcessedOn { get; set; }
}

[Index(nameof(Status), nameof(NextAttemptOn))]
public sealed class OutboxMessage
{
    [Key] public Guid Id { get; set; }
    [MaxLength(80)] public string Type { get; set; } = string.Empty;
    [MaxLength(100)] public string AggregateId { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = "{}";
    public OutboxStatus Status { get; set; } = OutboxStatus.Pending;
    public int AttemptCount { get; set; }
    public DateTime NextAttemptOn { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? ProcessedOn { get; set; }
    [MaxLength(1000)] public string? LastError { get; set; }
}
