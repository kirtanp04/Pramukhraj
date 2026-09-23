using pramukhraj.Common;
using pramukhraj.DTOs.Return;

namespace pramukhraj.Interfaces;

public interface IRefundService
{
    Task<ApiResponse<AdminRefundDetailDto>> ProcessRefundAsync(Guid returnId, AdminProcessRefundRequest request, CancellationToken ct = default);
    Task<bool> HandleRazorpayRefundWebhookAsync(string payloadJson, string signature, CancellationToken ct = default);
}

