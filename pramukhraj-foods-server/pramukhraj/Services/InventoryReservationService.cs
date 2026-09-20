using Microsoft.EntityFrameworkCore;
using pramukhraj.Database;
using pramukhraj.Entities.Order;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class InventoryReservationService(AppDbContext db, ILogger<InventoryReservationService> logger)
    : IInventoryReservationService
{
    public async Task CompleteAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        await db.InventoryReservations.Where(x => x.OrderId == orderId && x.Status == InventoryReservationStatus.Reserved)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.Status, InventoryReservationStatus.Completed)
                .SetProperty(x => x.CompletedOn, now), cancellationToken);
    }

    public async Task<bool> ReleaseAsync(Guid orderId, string reason, CancellationToken cancellationToken = default)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var reservations = await db.InventoryReservations
            .Where(x => x.OrderId == orderId && x.Status == InventoryReservationStatus.Reserved)
            .ToListAsync(cancellationToken);
        if (reservations.Count == 0) return false;
        foreach (var reservation in reservations)
        {
            await db.ProductVariants.Where(x => x.Id == reservation.ProductVariantId)
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.StockQuantity, x => x.StockQuantity + reservation.Quantity), cancellationToken);
            reservation.Status = InventoryReservationStatus.Released;
            reservation.ReleasedOn = DateTime.UtcNow;
        }
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        logger.LogInformation("Released inventory for order {OrderId}. Reason={Reason}", orderId, reason);
        return true;
    }
}
