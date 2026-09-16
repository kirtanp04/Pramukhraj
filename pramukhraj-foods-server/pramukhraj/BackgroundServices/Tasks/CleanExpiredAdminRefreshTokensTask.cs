using Microsoft.EntityFrameworkCore;
using pramukhraj.Database;
using pramukhraj.Interfaces;

namespace pramukhraj.BackgroundServices.Tasks;

public sealed class CleanExpiredAdminRefreshTokensTask(
    AppDbContext db,
    IBackgroundMetricsStore metrics,
    ILogger<CleanExpiredAdminRefreshTokensTask> logger) : IApplicationBackgroundTask
{
    public string Name => "Clean expired admin refresh tokens";

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var currentTime = DateTimeOffset.UtcNow;
        var deletedCount = await db.RefreshTokens
            .Where(token => token.ExpiresAt <= currentTime)
            .ExecuteDeleteAsync(cancellationToken);

        metrics.ReportTaskWork(Name, deletedCount, 0);

        if (deletedCount > 0)
            logger.LogInformation("Removed {RefreshTokenCount} expired admin refresh tokens.", deletedCount);
        else
            logger.LogDebug("No expired admin refresh tokens were found.");
    }
}
