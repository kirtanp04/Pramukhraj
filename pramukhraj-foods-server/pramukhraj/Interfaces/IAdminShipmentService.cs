using pramukhraj.Common;
using pramukhraj.DTOs.Shipment;

namespace pramukhraj.Interfaces;

public interface IAdminShipmentService
{
    Task<ApiResponse<AdminShipmentListPageResponse>> GetShipmentsAsync(AdminShipmentListRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<AdminShipmentDetailResponse>> GetShipmentDetailAsync(Guid shipmentId, CancellationToken cancellationToken = default);
}

