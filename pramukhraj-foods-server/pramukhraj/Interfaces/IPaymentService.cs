using pramukhraj.Common;
using pramukhraj.DTOs.Order;

namespace pramukhraj.Interfaces;

public interface IPaymentService
{
    Task<RazorpayCheckoutResponse> EnsureProviderOrderAsync(Guid orderId, Guid customerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<PaymentVerificationResponse>> VerifyAsync(Guid orderId, VerifyRazorpayPaymentRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<RazorpayCheckoutResponse>> RetryAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<ApiResponse<PaymentStatusResponse>> GetStatusAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<int> ProcessWebhookAsync(string body, string signature, CancellationToken cancellationToken = default);
    Task<int> ExpirePendingAsync(CancellationToken cancellationToken = default);
    Task<int> ReconcilePendingAsync(CancellationToken cancellationToken = default);
}
