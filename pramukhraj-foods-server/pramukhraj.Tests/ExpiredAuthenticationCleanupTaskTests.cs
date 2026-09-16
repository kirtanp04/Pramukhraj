using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using pramukhraj.BackgroundServices.Tasks;
using pramukhraj.Database;
using pramukhraj.Entities.Customer;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class ExpiredAuthenticationCleanupTaskTests
{
    [Fact]
    public async Task CleanupTasks_RemoveOnlyExpiredAuthenticationRecords()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;
        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();
        await db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");
        var now = DateTime.UtcNow;

        var expiredOtp = Otp(now.AddMinutes(-1));
        var validOtp = Otp(now.AddMinutes(5));
        var expiredCustomerToken = CustomerToken(now.AddMinutes(-1));
        var validCustomerToken = CustomerToken(now.AddDays(1));
        db.AddRange(
            expiredOtp,
            validOtp,
            expiredCustomerToken,
            validCustomerToken);
        await db.SaveChangesAsync();
        var metrics = new BackgroundMetricsStore();

        await new RemoveExpiredOtpChallengesTask(
            db,
            metrics,
            NullLogger<RemoveExpiredOtpChallengesTask>.Instance)
            .ExecuteAsync(CancellationToken.None);
        await new CleanExpiredRefreshTokensTask(
            db,
            metrics,
            NullLogger<CleanExpiredRefreshTokensTask>.Instance)
            .ExecuteAsync(CancellationToken.None);
        db.ChangeTracker.Clear();

        Assert.Null(await db.CustomerOtpChallenges.FindAsync(expiredOtp.Id));
        Assert.NotNull(await db.CustomerOtpChallenges.FindAsync(validOtp.Id));
        Assert.Null(await db.CustomerRefreshTokens.FindAsync(expiredCustomerToken.Id));
        Assert.NotNull(await db.CustomerRefreshTokens.FindAsync(validCustomerToken.Id));
    }

    private static CustomerOtpChallenge Otp(DateTime expiresOn) => new()
    {
        Id = Guid.NewGuid(),
        MobileNumber = $"+91{Random.Shared.NextInt64(1000000000, 9999999999)}",
        OtpHash = Guid.NewGuid().ToString("N"),
        Purpose = CustomerOtpPurpose.Authentication,
        MaxAttempts = 5,
        ExpiresOn = expiresOn,
        CreatedOn = DateTime.UtcNow
    };

    private static CustomerRefreshTokens CustomerToken(DateTime expiresOn) => new()
    {
        Id = Guid.NewGuid(),
        CustomerId = Guid.NewGuid(),
        TokenHash = Guid.NewGuid().ToString("N"),
        CreatedOn = DateTime.UtcNow,
        ExpiresOn = expiresOn
    };

}
