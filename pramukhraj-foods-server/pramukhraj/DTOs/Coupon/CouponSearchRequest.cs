using static pramukhraj.Entities.Coupon.CouponEnums;

namespace pramukhraj.DTOs.Coupon;

public sealed class CouponSearchRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public bool? IsActive { get; set; }
    public CouponDisplayStatus? Status { get; set; }
    public CouponDiscountType? DiscountType { get; set; }
    public CouponApplicationScope? ApplicationScope { get; set; }
    public DateTime? StartsOnOrAfter { get; set; }
    public DateTime? EndsOnOrBefore { get; set; }
    public string SortBy { get; set; } = "UpdatedOn";
    public bool SortDescending { get; set; } = true;
}
