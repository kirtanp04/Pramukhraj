using static pramukhraj.Entities.Coupon.CouponEnums;

namespace pramukhraj.DTOs.Coupon;

public sealed class CouponDetailsResponse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public CouponDiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal MinimumOrderAmount { get; set; }
    public decimal? MaximumDiscountAmount { get; set; }
    public CouponApplicationScope ApplicationScope { get; set; }
    public List<Guid> ProductIds { get; set; } = [];
    public List<Guid> CategoryIds { get; set; } = [];
    public int? TotalUsageLimit { get; set; }
    public int? PerCustomerUsageLimit { get; set; }
    public bool IsFirstOrderOnly { get; set; }
    public bool CanCombineWithOtherDiscounts { get; set; }
    public DateTime StartOn { get; set; }
    public DateTime EndOn { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime UpdatedOn { get; set; }
    public int RedeemedUsageCount { get; set; }
    public int ReservedUsageCount { get; set; }
}
