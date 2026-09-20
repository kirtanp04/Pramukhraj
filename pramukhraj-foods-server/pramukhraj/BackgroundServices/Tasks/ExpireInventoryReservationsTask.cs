using pramukhraj.Interfaces;

namespace pramukhraj.BackgroundServices.Tasks;

// Payment expiry owns the matching stock/coupon/order transition, so this task
// invokes the same idempotent bounded operation instead of restoring stock alone.
public sealed class ExpireInventoryReservationsTask(IServiceManager services, IBackgroundMetricsStore metrics) : IApplicationBackgroundTask
{
    public string Name => "Expire inventory reservations";
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var count = await services.PaymentService.ExpirePendingAsync(cancellationToken);
        metrics.ReportTaskWork(Name, count, 0);
    }
}
