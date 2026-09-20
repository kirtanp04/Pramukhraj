namespace pramukhraj.Interfaces;

public interface IShiprocketFulfillmentService
{
    Task<bool> CreateShipmentAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<int> ProcessWebhookAsync(string body, string? signature, CancellationToken cancellationToken = default);
}

