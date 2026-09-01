namespace pramukhraj.DTOs.Coupon;

public sealed class CouponListPageResponse
{
    public List<CouponListItemResponse> Items { get; set; } = [];
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
}
