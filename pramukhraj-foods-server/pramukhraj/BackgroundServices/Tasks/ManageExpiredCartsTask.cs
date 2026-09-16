using Microsoft.EntityFrameworkCore;
using pramukhraj.Database;
using pramukhraj.Entities.Cart;
using pramukhraj.Interfaces;

namespace pramukhraj.BackgroundServices.Tasks;

public sealed class ManageExpiredCartsTask(
    AppDbContext db,
    IBackgroundMetricsStore metrics,
    ILogger<ManageExpiredCartsTask> logger) : IApplicationBackgroundTask
{
    public string Name => "Manage expired carts";

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var currentTime = DateTime.UtcNow;
        var updatedCount = await db.Carts
            .Where(cart =>
                cart.Status == CartStatus.Active &&
                cart.ExpiresOn.HasValue &&
                cart.ExpiresOn <= currentTime)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(cart => cart.Status, CartStatus.Abandoned)
                    .SetProperty(cart => cart.UpdatedOn, currentTime)
                    .SetProperty(cart => cart.Version, cart => cart.Version + 1),
                cancellationToken);

        metrics.ReportTaskWork(Name, updatedCount, 0);

        if (updatedCount > 0)
            logger.LogInformation("Marked {CartCount} expired carts as abandoned.", updatedCount);
        else
            logger.LogDebug("No expired carts were found.");
    }
}
