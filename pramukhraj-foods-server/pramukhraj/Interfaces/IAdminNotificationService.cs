using System.Threading.Channels;
using pramukhraj.DTOs.Notifications;

namespace pramukhraj.Interfaces;

public interface IAdminNotificationService
{
    Task<AdminNotificationResponse?> CreateAsync(CreateAdminNotification request, bool publishImmediately = true, CancellationToken cancellationToken = default);
    Task<AdminNotificationListResponse> GetForAdminAsync(string adminId, int pageNumber, int pageSize, bool onlyUnacknowledged, CancellationToken cancellationToken = default);
    Task<bool> AcknowledgeAsync(string adminId, Guid notificationId, CancellationToken cancellationToken = default);
    Task<int> AcknowledgeAllAsync(string adminId, CancellationToken cancellationToken = default);
    Task PublishAsync(AdminNotificationResponse notification, CancellationToken cancellationToken = default);
    AdminNotificationSubscription Subscribe(string adminId);
}

public sealed class AdminNotificationSubscription(ChannelReader<AdminNotificationResponse> reader, Action dispose) : IDisposable
{
    public ChannelReader<AdminNotificationResponse> Reader { get; } = reader;
    public void Dispose() => dispose();
}
