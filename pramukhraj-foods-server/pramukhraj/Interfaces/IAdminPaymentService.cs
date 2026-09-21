using pramukhraj.Common;
using pramukhraj.DTOs.Payment;

namespace pramukhraj.Interfaces;

public interface IAdminPaymentService
{
    Task<ApiResponse<AdminPaymentListPageResponse>> GetPaymentsAsync(AdminPaymentListRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<AdminPaymentDetailResponse>> GetPaymentDetailAsync(Guid paymentId, CancellationToken cancellationToken = default);
}

