using pramukhraj.Common;
using pramukhraj.DTOs.Return;

namespace pramukhraj.Interfaces;

public interface IReturnService
{
    // Customer APIs
    Task<ApiResponse<ReturnEligibilityResponse>> GetOrderReturnEligibilityAsync(Guid orderId, Guid customerId, CancellationToken ct = default);
    Task<ApiResponse<CustomerReturnDetailsResponse>> CreateReturnRequestAsync(Guid orderId, Guid customerId, CreateReturnRequest request, CancellationToken ct = default);
    Task<ApiResponse<CustomerReturnListPageResponse>> GetCustomerReturnsAsync(Guid customerId, int page, int pageSize, CancellationToken ct = default);
    Task<ApiResponse<CustomerReturnDetailsResponse>> GetCustomerReturnDetailsAsync(Guid returnId, Guid customerId, CancellationToken ct = default);
    Task<ApiResponse<CustomerReturnDetailsResponse>> CancelReturnRequestAsync(Guid returnId, Guid customerId, CancellationToken ct = default);

    // Admin APIs
    Task<ApiResponse<AdminReturnListPageResponse>> GetAdminReturnsAsync(AdminReturnFilterRequest filter, CancellationToken ct = default);
    Task<ApiResponse<AdminReturnDetailsResponse>> GetAdminReturnDetailsAsync(Guid returnId, CancellationToken ct = default);
    Task<ApiResponse<AdminReturnDetailsResponse>> ApproveReturnAsync(Guid returnId, AdminApproveReturnRequest request, CancellationToken ct = default);
    Task<ApiResponse<AdminReturnDetailsResponse>> RejectReturnAsync(Guid returnId, AdminRejectReturnRequest request, CancellationToken ct = default);
    Task<ApiResponse<AdminReturnDetailsResponse>> InspectReturnAsync(Guid returnId, AdminInspectReturnRequest request, CancellationToken ct = default);
}

