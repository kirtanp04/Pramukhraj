using pramukhraj.DTOs.Return;
using pramukhraj.Entities.Return;

namespace pramukhraj.Interfaces;

public interface IShiprocketFulfillmentService
{
    Task<bool> CreateShipmentAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<int> ProcessWebhookAsync(string body, string? signature, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReverseCourierOptionDto>> GetReverseCouriersAsync(string customerPostalCode, decimal weightKg, CancellationToken cancellationToken = default);
    Task<ReverseBookingResult> BookReversePickupAsync(ReturnRequest returnRequest, int? courierCompanyId, CancellationToken cancellationToken = default);
}


