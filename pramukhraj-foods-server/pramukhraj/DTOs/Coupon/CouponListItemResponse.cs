using System.Text.Json.Serialization;
using static pramukhraj.Entities.Coupon.CouponEnums;

namespace pramukhraj.DTOs.Coupon;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CouponDisplayStatus
{
    Scheduled,
    Active,
    Expired,
    Inactive,
    UsageLimitReached,
    Archived
}

public sealed class CouponListItemResponse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public CouponDiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public string DisplayFriendlyDiscount { get; set; } = string.Empty;
    public CouponApplicationScope ApplicationScope { get; set; }
    public decimal MinimumOrderAmount { get; set; }
    public decimal? MaximumDiscountAmount { get; set; }
    public int? TotalUsageLimit { get; set; }
    public int? PerCustomerUsageLimit { get; set; }
    public int RedeemedUsageCount { get; set; }
    public DateTime StartOn { get; set; }
    public DateTime EndOn { get; set; }
    public bool IsActive { get; set; }
    public bool IsDeleted { get; set; }
    public CouponDisplayStatus ComputedStatus { get; set; }
    public int ScopeItemCount { get; set; }
}
