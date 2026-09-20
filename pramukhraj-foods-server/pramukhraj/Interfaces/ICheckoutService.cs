using pramukhraj.Common;
using pramukhraj.DTOs.Checkout;

namespace pramukhraj.Interfaces;

public interface ICheckoutService
{
    Task<ApiResponse<CheckoutSessionResponse>> InitializeAsync(InitializeCheckoutRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<CheckoutSessionResponse>> GetAsync(Guid checkoutSessionId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CheckoutSessionResponse>> UpdateAddressAsync(Guid checkoutSessionId, UpdateCheckoutAddressRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<CheckoutSessionResponse>> ApplyCouponAsync(Guid checkoutSessionId, ApplyCheckoutCouponRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<CheckoutSessionResponse>> RemoveCouponAsync(Guid checkoutSessionId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CheckoutSessionResponse>> RefreshAsync(Guid checkoutSessionId, CancellationToken cancellationToken = default);
}
