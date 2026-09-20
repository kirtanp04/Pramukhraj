using Microsoft.EntityFrameworkCore;
using pramukhraj.Database;
using pramukhraj.Interfaces;

namespace pramukhraj.BackgroundServices.Tasks;

public sealed class CleanupAdminNotificationsTask(AppDbContext db, IBackgroundMetricsStore metrics) : IApplicationBackgroundTask
{
    public string Name => "Clean acknowledged admin notifications";
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var cutoff = DateTime.UtcNow.AddDays(-90);
        var count = await db.AdminNotifications.Where(x => (x.ExpiresOn != null && x.ExpiresOn < DateTime.UtcNow) || (x.CreatedOn < cutoff && x.Recipients.All(r => r.ReadOn != null)))
            .ExecuteDeleteAsync(cancellationToken);
        metrics.ReportTaskWork(Name, count, 0);
    }
}
