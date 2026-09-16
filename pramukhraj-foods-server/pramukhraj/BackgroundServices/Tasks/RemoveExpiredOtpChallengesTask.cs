using Microsoft.EntityFrameworkCore;
using pramukhraj.Database;
using pramukhraj.Interfaces;

namespace pramukhraj.BackgroundServices.Tasks;

public sealed class RemoveExpiredOtpChallengesTask(
    AppDbContext db,
    IBackgroundMetricsStore metrics,
    ILogger<RemoveExpiredOtpChallengesTask> logger) : IApplicationBackgroundTask
{
    public string Name => "Remove expired OTP challenges";

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var currentTime = DateTime.UtcNow;
        var deletedCount = await db.CustomerOtpChallenges
            .Where(challenge => challenge.ExpiresOn <= currentTime)
            .ExecuteDeleteAsync(cancellationToken);

        metrics.ReportTaskWork(Name, deletedCount, 0);

        if (deletedCount > 0)
            logger.LogInformation("Removed {OtpChallengeCount} expired OTP challenges.", deletedCount);
        else
            logger.LogDebug("No expired OTP challenges were found.");
    }
}
