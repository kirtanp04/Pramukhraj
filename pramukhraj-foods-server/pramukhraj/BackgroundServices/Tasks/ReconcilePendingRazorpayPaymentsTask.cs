using pramukhraj.Interfaces;

namespace pramukhraj.BackgroundServices.Tasks;

public sealed class ReconcilePendingRazorpayPaymentsTask(IServiceManager services, IBackgroundMetricsStore metrics) : IApplicationBackgroundTask
{
    public string Name => "Reconcile pending Razorpay payments";
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var count = await services.PaymentService.ReconcilePendingAsync(cancellationToken);
        metrics.ReportTaskWork(Name, count, 0);
    }
}
