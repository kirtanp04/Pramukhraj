using pramukhraj.Common;
using pramukhraj.DTOs.Coupon;

namespace pramukhraj.Interfaces;

public interface ICouponService
{
    Task<ApiResponse<Guid>> CreateCouponAsync(CreateCouponRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<Guid>> UpdateCouponAsync(Guid couponId, UpdateCouponRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<CouponDetailsResponse>> GetCouponByIdAsync(Guid couponId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CouponListPageResponse>> GetCouponListAsync(CouponSearchRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<string>> ArchiveCouponAsync(Guid couponId, CancellationToken cancellationToken = default);
}
