using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using pramukhraj.Database;
using pramukhraj.DTOs.Notifications;
using pramukhraj.Entities;
using pramukhraj.Entities.Notifications;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class AdminNotificationServiceTests
{
    [Fact]
    public async Task Notification_is_persisted_for_each_admin_and_acknowledged_independently()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();
        var firstAdmin = Admin();
        var secondAdmin = Admin();
        db.Users.AddRange(firstAdmin, secondAdmin);
        await db.SaveChangesAsync();

        var service = new AdminNotificationService(db, new AdminNotificationStreamHub(), NullLogger<AdminNotificationService>.Instance);
        var created = await service.CreateAsync(new CreateAdminNotification(
            AdminNotificationTypes.CustomerRegistered,
            NotificationSeverities.Info,
            "New customer registered",
            "A customer registered.",
            ActionUrl: "/admin/customers"), publishImmediately: false);

        Assert.NotNull(created);
        Assert.Equal(2, await db.AdminNotificationRecipients.CountAsync());
        var firstList = await service.GetForAdminAsync(firstAdmin.Id, 1, 20, false);
        Assert.Single(firstList.Items);
        Assert.Equal(1, firstList.UnacknowledgedCount);

        Assert.True(await service.AcknowledgeAsync(firstAdmin.Id, created!.Id));
        var acknowledged = await service.GetForAdminAsync(firstAdmin.Id, 1, 20, false);
        var stillUnread = await service.GetForAdminAsync(secondAdmin.Id, 1, 20, false);
        Assert.NotNull(acknowledged.Items[0].AcknowledgedOn);
        Assert.Equal(0, acknowledged.UnacknowledgedCount);
        Assert.Equal(1, stillUnread.UnacknowledgedCount);
    }

    [Fact]
    public async Task Published_notification_is_delivered_to_connected_recipient()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();
        var admin = Admin();
        db.Users.Add(admin);
        await db.SaveChangesAsync();
        var hub = new AdminNotificationStreamHub();
        var service = new AdminNotificationService(db, hub, NullLogger<AdminNotificationService>.Instance);
        using var subscription = service.Subscribe(admin.Id);
        var created = await service.CreateAsync(new CreateAdminNotification(
            AdminNotificationTypes.CustomerRegistered,
            NotificationSeverities.Info,
            "New customer registered",
            "A customer registered."));

        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(2));
        var streamed = await subscription.Reader.ReadAsync(timeout.Token);
        Assert.Equal(created!.Id, streamed.Id);
    }

    private static ApplicationUser Admin() => new()
    {
        Id = Guid.NewGuid().ToString(),
        UserName = $"admin-{Guid.NewGuid():N}",
        NormalizedUserName = Guid.NewGuid().ToString("N").ToUpperInvariant(),
        Email = $"{Guid.NewGuid():N}@example.com",
        NormalizedEmail = $"{Guid.NewGuid():N}@EXAMPLE.COM",
        EmailConfirmed = true,
    };
}
