namespace pramukhraj.Interfaces;

public interface IAdminNotificationBackplane
{
    Task PublishAsync(Guid notificationId, CancellationToken cancellationToken = default);
}
