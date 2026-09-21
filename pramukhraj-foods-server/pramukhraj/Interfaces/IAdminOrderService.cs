using pramukhraj.Common;
using pramukhraj.DTOs.Order;

namespace pramukhraj.Interfaces;

public interface IAdminOrderService
{
    Task<ApiResponse<AdminOrderListPageResponse>> GetOrdersAsync(AdminOrderListRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<AdminOrderDetailResponse>> GetOrderDetailAsync(Guid orderId, CancellationToken cancellationToken = default);
}

