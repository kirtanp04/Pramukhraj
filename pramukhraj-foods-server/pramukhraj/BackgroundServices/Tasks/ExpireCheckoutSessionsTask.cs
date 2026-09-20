using Microsoft.EntityFrameworkCore;
using pramukhraj.Database;
using pramukhraj.Interfaces;

namespace pramukhraj.BackgroundServices.Tasks;

public sealed class ExpireCheckoutSessionsTask(AppDbContext db, IBackgroundMetricsStore metrics) : IApplicationBackgroundTask
{
    public string Name => "Clean expired checkout sessions";
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var cutoff = DateTime.UtcNow.AddDays(-1);
        var count = await db.CheckoutSessions.Where(x => x.ConsumedOn == null && x.ExpiresOn < cutoff)
            .ExecuteDeleteAsync(cancellationToken);
        metrics.ReportTaskWork(Name, count, 0);
    }
}
