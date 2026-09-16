using Microsoft.EntityFrameworkCore;
using pramukhraj.Database;
using pramukhraj.Interfaces;

namespace pramukhraj.BackgroundServices.Tasks;

public sealed class CleanExpiredRefreshTokensTask(
    AppDbContext db,
    IBackgroundMetricsStore metrics,
    ILogger<CleanExpiredRefreshTokensTask> logger) : IApplicationBackgroundTask
{
    public string Name => "Clean expired refresh tokens";

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var currentTime = DateTime.UtcNow;
        var deletedCount = await db.CustomerRefreshTokens
            .Where(token => token.ExpiresOn <= currentTime)
            .ExecuteDeleteAsync(cancellationToken);

        metrics.ReportTaskWork(Name, deletedCount, 0);

        if (deletedCount > 0)
            logger.LogInformation("Removed {RefreshTokenCount} expired customer refresh tokens.", deletedCount);
        else
            logger.LogDebug("No expired customer refresh tokens were found.");
    }
}
