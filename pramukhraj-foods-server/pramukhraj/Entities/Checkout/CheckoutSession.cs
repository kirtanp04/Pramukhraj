using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Checkout;

[Table("CheckoutSessions")]
[Index(nameof(CustomerId), nameof(ExpiresOn))]
[Index(nameof(CartId), nameof(CartVersion))]
public sealed class CheckoutSession
{
    [Key] public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid CartId { get; set; }
    public int CartVersion { get; set; }
    public Guid? ShippingAddressId { get; set; }
    public Guid? BillingAddressId { get; set; }
    public Guid? CouponId { get; set; }
    [MaxLength(50)] public string? CouponCode { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal Subtotal { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal ItemDiscountAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal CouponDiscountAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal CustomerShippingAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal ProviderShippingCost { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal TaxAmount { get; set; }
    [Column(TypeName = "decimal(18,2)")] public decimal GrandTotal { get; set; }
    [Required, MaxLength(3)] public string Currency { get; set; } = "INR";
    public int? SelectedCourierId { get; set; }
    [MaxLength(200)] public string? SelectedCourierName { get; set; }
    public DateTime? EstimatedDeliveryOn { get; set; }
    public DateTime? ShippingQuoteExpiresOn { get; set; }
    [Column(TypeName = "jsonb")] public string? ShippingQuoteJson { get; set; }
    public DateTime ExpiresOn { get; set; }
    public DateTime? ConsumedOn { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime UpdatedOn { get; set; }
    [MaxLength(64), ConcurrencyCheck] public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString("N");
}
