using System.Collections.Concurrent;
using System.Threading.Channels;
using pramukhraj.DTOs.Notifications;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class AdminNotificationStreamHub
{
    private readonly ConcurrentDictionary<Guid, ClientSubscription> _clients = new();

    public AdminNotificationSubscription Subscribe(string adminId)
    {
        var id = Guid.NewGuid();
        var channel = Channel.CreateBounded<AdminNotificationResponse>(new BoundedChannelOptions(100)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });
        _clients[id] = new ClientSubscription(adminId, channel);
        return new AdminNotificationSubscription(channel.Reader, () => Remove(id));
    }

    public void Publish(AdminNotificationResponse notification, IReadOnlySet<string> recipients)
    {
        foreach (var client in _clients.Values)
        {
            if (recipients.Contains(client.AdminId)) client.Channel.Writer.TryWrite(notification);
        }
    }

    private void Remove(Guid id)
    {
        if (_clients.TryRemove(id, out var client)) client.Channel.Writer.TryComplete();
    }

    private sealed record ClientSubscription(string AdminId, Channel<AdminNotificationResponse> Channel);
}
