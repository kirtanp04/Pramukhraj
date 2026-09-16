using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using pramukhraj.BackgroundServices.Tasks;
using pramukhraj.Database;
using pramukhraj.Entities.Cart;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class ManageExpiredCartsTaskTests
{
    [Fact]
    public async Task ExecuteAsync_AbandonsOnlyExpiredActiveCarts_AndIncrementsVersion()
    {
        await using var database = await TestDatabase.CreateAsync();
        var now = DateTime.UtcNow;
        var expired = Cart(CartStatus.Active, now.AddMinutes(-1), 4);
        var notExpired = Cart(CartStatus.Active, now.AddDays(1), 2);
        var converted = Cart(CartStatus.Converted, now.AddDays(-1), 3);
        var abandoned = Cart(CartStatus.Abandoned, now.AddDays(-1), 5);
        var noExpiration = Cart(CartStatus.Active, null, 6);
        database.Context.Carts.AddRange(expired, notExpired, converted, abandoned, noExpiration);
        await database.Context.SaveChangesAsync();

        var task = new ManageExpiredCartsTask(
            database.Context,
            new BackgroundMetricsStore(),
            NullLogger<ManageExpiredCartsTask>.Instance);
        await task.ExecuteAsync(CancellationToken.None);
        database.Context.ChangeTracker.Clear();

        var carts = await database.Context.Carts.ToDictionaryAsync(cart => cart.Id);
        Assert.Equal(CartStatus.Abandoned, carts[expired.Id].Status);
        Assert.Equal(5, carts[expired.Id].Version);
        Assert.Equal(CartStatus.Active, carts[notExpired.Id].Status);
        Assert.Equal(2, carts[notExpired.Id].Version);
        Assert.Equal(CartStatus.Converted, carts[converted.Id].Status);
        Assert.Equal(3, carts[converted.Id].Version);
        Assert.Equal(CartStatus.Abandoned, carts[abandoned.Id].Status);
        Assert.Equal(5, carts[abandoned.Id].Version);
        Assert.Equal(CartStatus.Active, carts[noExpiration.Id].Status);
        Assert.Equal(6, carts[noExpiration.Id].Version);

        await task.ExecuteAsync(CancellationToken.None);
        database.Context.ChangeTracker.Clear();
        Assert.Equal(5, (await database.Context.Carts.FindAsync(expired.Id))?.Version);
    }

    [Fact]
    public async Task ExecuteAsync_WithNoExpiredCarts_CompletesSuccessfully()
    {
        await using var database = await TestDatabase.CreateAsync();
        database.Context.Carts.Add(Cart(CartStatus.Active, DateTime.UtcNow.AddDays(1), 1));
        await database.Context.SaveChangesAsync();

        var task = new ManageExpiredCartsTask(
            database.Context,
            new BackgroundMetricsStore(),
            NullLogger<ManageExpiredCartsTask>.Instance);

        await task.ExecuteAsync(CancellationToken.None);
    }

    [Fact]
    public async Task ExecuteAsync_WithCancellation_StopsSafely()
    {
        await using var database = await TestDatabase.CreateAsync();
        using var cancellation = new CancellationTokenSource();
        await cancellation.CancelAsync();
        var task = new ManageExpiredCartsTask(
            database.Context,
            new BackgroundMetricsStore(),
            NullLogger<ManageExpiredCartsTask>.Instance);

        await Assert.ThrowsAnyAsync<OperationCanceledException>(
            () => task.ExecuteAsync(cancellation.Token));
    }

    private static Cart Cart(CartStatus status, DateTime? expiresOn, int version) => new()
    {
        Id = Guid.NewGuid(),
        CustomerId = Guid.NewGuid(),
        Status = status,
        Version = version,
        CreatedOn = DateTime.UtcNow.AddDays(-2),
        UpdatedOn = DateTime.UtcNow.AddDays(-1),
        ExpiresOn = expiresOn,
        ConcurrencyStamp = Guid.NewGuid().ToString("N")
    };

    private sealed class TestDatabase(SqliteConnection connection, AppDbContext context) : IAsyncDisposable
    {
        public AppDbContext Context { get; } = context;

        public static async Task<TestDatabase> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(connection)
                .Options;
            var context = new AppDbContext(options);
            await context.Database.EnsureCreatedAsync();
            await context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");
            return new TestDatabase(connection, context);
        }

        public async ValueTask DisposeAsync()
        {
            await Context.DisposeAsync();
            await connection.DisposeAsync();
        }
    }
}
