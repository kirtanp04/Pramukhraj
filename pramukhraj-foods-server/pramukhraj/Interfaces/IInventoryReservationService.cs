namespace pramukhraj.Interfaces;

public interface IInventoryReservationService
{
    Task<bool> ReleaseAsync(Guid orderId, string reason, CancellationToken cancellationToken = default);
    Task CompleteAsync(Guid orderId, CancellationToken cancellationToken = default);
}
