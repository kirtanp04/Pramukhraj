using pramukhraj.Interfaces;

namespace pramukhraj.BackgroundServices.Tasks;

public sealed class ExpirePendingPaymentOrdersTask(IServiceManager services, IBackgroundMetricsStore metrics) : IApplicationBackgroundTask
{
    public string Name => "Expire pending payment orders";
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var count = await services.PaymentService.ExpirePendingAsync(cancellationToken);
        metrics.ReportTaskWork(Name, count, 0);
    }
}
