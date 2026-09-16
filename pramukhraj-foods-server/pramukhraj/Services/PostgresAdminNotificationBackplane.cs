using Microsoft.EntityFrameworkCore;
using Npgsql;
using pramukhraj.Database;
using pramukhraj.DTOs.Notifications;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

/// <summary>
/// Uses PostgreSQL LISTEN/NOTIFY to fan notifications out to SSE clients on
/// every application instance. The database remains the source of truth.
/// </summary>
public sealed class PostgresAdminNotificationBackplane(
    IConfiguration configuration,
    IServiceScopeFactory scopeFactory,
    AdminNotificationStreamHub streamHub,
    ILogger<PostgresAdminNotificationBackplane> logger) : BackgroundService, IAdminNotificationBackplane
{
    private const string ChannelName = "admin_notifications";
    private readonly string _connectionString = configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("DefaultConnection is required for the notification backplane.");
    private readonly string _instanceId = Guid.NewGuid().ToString("N");

    public async Task PublishAsync(Guid notificationId, CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new NpgsqlCommand("SELECT pg_notify(@channel, @payload)", connection);
            command.Parameters.AddWithValue("channel", ChannelName);
            command.Parameters.AddWithValue("payload", $"{_instanceId}:{notificationId:N}");
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            // Local delivery has already happened. Reconciliation from the DB
            // prevents a transient backplane outage from losing notifications.
            logger.LogWarning(exception, "Unable to publish admin notification {NotificationId} to the PostgreSQL backplane.", notificationId);
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ListenAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Admin notification backplane disconnected; retrying.");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task ListenAsync(CancellationToken cancellationToken)
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        connection.Notification += (_, args) =>
        {
            if (!TryReadRemoteNotification(args.Payload, out var notificationId)) return;
            _ = DeliverToLocalClientsAsync(notificationId, cancellationToken);
        };

        await connection.OpenAsync(cancellationToken);
        await using (var command = new NpgsqlCommand($"LISTEN {ChannelName}", connection))
        {
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        logger.LogInformation("Admin notification PostgreSQL backplane is listening.");
        while (!cancellationToken.IsCancellationRequested)
        {
            await connection.WaitAsync(cancellationToken);
        }
    }

    private bool TryReadRemoteNotification(string payload, out Guid notificationId)
    {
        notificationId = default;
        var separator = payload.IndexOf(':');
        if (separator <= 0 || payload[..separator] == _instanceId) return false;
        return Guid.TryParse(payload[(separator + 1)..], out notificationId);
    }

    private async Task DeliverToLocalClientsAsync(Guid notificationId, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var deliveries = await db.AdminNotificationRecipients.AsNoTracking()
                .Where(item => item.NotificationId == notificationId)
                .Select(item => new
                {
                    item.AdminId,
                    Notification = new AdminNotificationResponse(
                        item.Notification.Id,
                        item.Notification.Type,
                        item.Notification.Severity,
                        item.Notification.Title,
                        item.Notification.Message,
                        item.Notification.EntityType,
                        item.Notification.EntityId,
                        item.Notification.ActionUrl,
                        item.Notification.MetadataJson,
                        item.Notification.CreatedOn,
                        item.AcknowledgedOn)
                })
                .ToListAsync(cancellationToken);

            if (deliveries.Count == 0) return;
            streamHub.Publish(
                deliveries[0].Notification,
                deliveries.Select(item => item.AdminId).ToHashSet(StringComparer.Ordinal));
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Unable to deliver remote admin notification {NotificationId} locally.", notificationId);
        }
    }
}
