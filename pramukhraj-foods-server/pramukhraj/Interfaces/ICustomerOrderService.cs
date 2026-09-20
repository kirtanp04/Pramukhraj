using pramukhraj.Common;
using pramukhraj.DTOs.Order;

namespace pramukhraj.Interfaces;

public interface ICustomerOrderService
{
    Task<ApiResponse<CustomerOrderListResponse>> GetCustomerOrdersAsync(int page, int pageSize, string? status, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerOrderDetailResponse>> GetCustomerOrderDetailAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerOrderTrackingResponse>> GetCustomerOrderTrackingAsync(Guid orderId, CancellationToken cancellationToken = default);
}

