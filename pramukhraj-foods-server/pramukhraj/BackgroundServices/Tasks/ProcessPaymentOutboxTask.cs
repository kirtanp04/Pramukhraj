using Microsoft.EntityFrameworkCore;
using pramukhraj.Database;
using pramukhraj.DTOs.Notifications;
using pramukhraj.Entities.Order;
using pramukhraj.Interfaces;

namespace pramukhraj.BackgroundServices.Tasks;

public sealed class ProcessPaymentOutboxTask(AppDbContext db, IServiceManager services, IBackgroundMetricsStore metrics,
    ILogger<ProcessPaymentOutboxTask> logger) : IApplicationBackgroundTask
{
    public string Name => "Process checkout outbox";

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var messages = await db.OutboxMessages.Where(x => (x.Type == "BroadcastAdminNotification" || x.Type == "CreateShiprocketOrder") &&
                (x.Status == OutboxStatus.Pending || (x.Status == OutboxStatus.Failed && x.NextAttemptOn <= DateTime.UtcNow)))
            .OrderBy(x => x.CreatedOn).Take(100).ToListAsync(cancellationToken);
        var succeeded = 0; var failed = 0;
        foreach (var message in messages)
        {
            try
            {
                message.Status = OutboxStatus.Processing; message.AttemptCount++;
                await db.SaveChangesAsync(cancellationToken);
                if (message.Type == "BroadcastAdminNotification")
                {
                    if (!Guid.TryParse(message.AggregateId, out var id)) throw new InvalidOperationException("Invalid notification outbox aggregate.");
                    var notification = await db.AdminNotifications.AsNoTracking().Where(x => x.Id == id)
                        .Select(x => new AdminNotificationResponse(x.Id, x.Type, x.Severity, x.Title, x.Message, x.EntityType,
                            x.EntityId, x.ActionUrl, x.MetadataJson, x.CreatedOn, null, 0, null)).SingleAsync(cancellationToken);
                    await services.AdminNotificationService.PublishAsync(notification, cancellationToken);
                }
                else if (message.Type == "CreateShiprocketOrder")
                {
                    if (!Guid.TryParse(message.AggregateId, out var orderId)) throw new InvalidOperationException("Invalid order outbox aggregate.");
                    var success = await services.ShiprocketFulfillmentService.CreateShipmentAsync(orderId, cancellationToken);
                    if (!success)
                    {
                        throw new InvalidOperationException($"Shiprocket shipment creation returned false for order {orderId}.");
                    }
                }
                message.Status = OutboxStatus.Completed; message.ProcessedOn = DateTime.UtcNow; message.LastError = null; succeeded++;
            }
            catch (Exception exception)
            {
                failed++; message.Status = OutboxStatus.Failed; message.LastError = exception.Message;
                message.NextAttemptOn = DateTime.UtcNow.AddMinutes(Math.Min(60, Math.Pow(2, Math.Min(message.AttemptCount, 5))));
                logger.LogError(exception, "Outbox message {MessageId} failed: {ErrorMessage}", message.Id, exception.Message);
            }
            await db.SaveChangesAsync(cancellationToken);
        }
        metrics.ReportTaskWork(Name, succeeded, failed);
    }
}
