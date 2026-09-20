using pramukhraj.Common;
using pramukhraj.DTOs.Order;

namespace pramukhraj.Interfaces;

public interface IOrderService
{
    Task<ApiResponse<PlaceOrderResponse>> PlaceAsync(PlaceOrderRequest request, string idempotencyKey, CancellationToken cancellationToken = default);
}
