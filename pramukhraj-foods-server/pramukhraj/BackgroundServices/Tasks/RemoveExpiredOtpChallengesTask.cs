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
        var deletedEmailCount = await db.CustomerEmailVerificationChallenges
            .Where(challenge => challenge.ExpiresOn <= currentTime)
            .ExecuteDeleteAsync(cancellationToken);

        var totalDeleted = deletedCount + deletedEmailCount;
        metrics.ReportTaskWork(Name, totalDeleted, 0);

        if (totalDeleted > 0)
            logger.LogInformation(
                "Removed {SmsOtpChallengeCount} SMS and {EmailOtpChallengeCount} email verification challenges.",
                deletedCount,
                deletedEmailCount);
        else
            logger.LogDebug("No expired OTP challenges were found.");
    }
}
