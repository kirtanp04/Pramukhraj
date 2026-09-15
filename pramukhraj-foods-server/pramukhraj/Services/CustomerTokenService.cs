using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using pramukhraj.Configurations;
using pramukhraj.Database;
using pramukhraj.Entities.Customer;
using pramukhraj.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace pramukhraj.Services;

public sealed class CustomerTokenService(
    AppDbContext db,
    IOptions<JwtSettings> jwtOptions,
    IOptions<CustomerOtpSettings> otpOptions) : ICustomerTokenService
{
    private readonly JwtSettings _settings = jwtOptions.Value;
    private readonly CustomerOtpSettings _otpSettings = otpOptions.Value;

    public async Task<CustomerTokenPair> IssueAsync(Customer customer, string? deviceName, string ipAddress, CancellationToken cancellationToken)
    {
        var plainRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        db.CustomerRefreshTokens.Add(new CustomerRefreshTokens
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            TokenHash = Hash(plainRefreshToken),
            DeviceName = string.IsNullOrWhiteSpace(deviceName) ? null : deviceName.Trim(),
            IpAddressHash = Hash(ipAddress),
            CreatedOn = DateTime.UtcNow,
            ExpiresOn = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpirationDays)
        });
        await db.SaveChangesAsync(cancellationToken);
        return CreatePair(customer, plainRefreshToken);
    }

    public async Task<(Customer Customer, CustomerTokenPair Tokens)> RotateAsync(string refreshToken, string ipAddress, CancellationToken cancellationToken)
    {
        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            db.ChangeTracker.Clear();
            await using var transaction = await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, cancellationToken);
            var tokenHash = Hash(refreshToken);
            var existing = await db.CustomerRefreshTokens
                .Include(x => x.Customer)
                .SingleOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken)
                ?? throw new UnauthorizedAccessException("Invalid refresh token.");

            if (existing.RevokedOn is not null)
            {
                await db.CustomerRefreshTokens
                    .Where(x => x.CustomerId == existing.CustomerId && x.RevokedOn == null)
                    .ExecuteUpdateAsync(x => x.SetProperty(t => t.RevokedOn, DateTime.UtcNow), cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                throw new UnauthorizedAccessException("Refresh token reuse detected.");
            }

            if (existing.ExpiresOn <= DateTime.UtcNow || !CanSignIn(existing.Customer))
                throw new UnauthorizedAccessException("Refresh token has expired.");

            var newPlainToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
            var newHash = Hash(newPlainToken);
            existing.RevokedOn = DateTime.UtcNow;
            existing.ReplacedByTokenHash = newHash;
            db.CustomerRefreshTokens.Add(new CustomerRefreshTokens
            {
                Id = Guid.NewGuid(),
                CustomerId = existing.CustomerId,
                TokenHash = newHash,
                DeviceName = existing.DeviceName,
                IpAddressHash = Hash(ipAddress),
                CreatedOn = DateTime.UtcNow,
                ExpiresOn = DateTime.UtcNow.AddDays(_settings.RefreshTokenExpirationDays)
            });
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return (existing.Customer, CreatePair(existing.Customer, newPlainToken));
        });
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var hash = Hash(refreshToken);
        var token = await db.CustomerRefreshTokens.SingleOrDefaultAsync(x => x.TokenHash == hash, cancellationToken);
        if (token is null || token.RevokedOn is not null) return;
        token.RevokedOn = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    private CustomerTokenPair CreatePair(Customer customer, string refreshToken)
    {
        var expires = DateTime.UtcNow.AddMinutes(_otpSettings.AccessTokenExpirationMinutes);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, customer.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new Claim(ClaimTypes.Role, "Customer"),
            new Claim(ClaimTypes.Name, customer.FullName ?? string.Empty),
            new Claim(ClaimTypes.MobilePhone, customer.MobileNumber),
            new Claim("token_version", customer.TokenVersion.ToString()),
            new Claim("mobile_verified", customer.IsMobileVerified.ToString().ToLowerInvariant())
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(_settings.Issuer, _settings.Audience, claims,
            expires: expires, signingCredentials: credentials);
        return new CustomerTokenPair(
            new JwtSecurityTokenHandler().WriteToken(token),
            refreshToken,
            checked((int)TimeSpan.FromMinutes(_otpSettings.AccessTokenExpirationMinutes).TotalSeconds));
    }

    private static bool CanSignIn(Customer customer) =>
        customer.IsActive && !customer.IsBlocked && !customer.IsDeleted && customer.IsMobileVerified;

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
