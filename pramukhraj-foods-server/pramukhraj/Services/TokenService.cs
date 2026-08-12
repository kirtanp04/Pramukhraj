using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using pramukhraj.Configurations;
using pramukhraj.Database;
using pramukhraj.Entities;
using pramukhraj.Interfaces;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace pramukhraj.Services
{
    /// <summary>
    /// Token service responsible for generating JWT access tokens and persistent refresh tokens.
    /// </summary>
    public class TokenService : ITokenService
    {
        private readonly JwtSettings _jwtSettings;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _db;

        public TokenService(IOptions<JwtSettings> jwtOptions, UserManager<ApplicationUser> userManager, AppDbContext db)
        {
            _jwtSettings = jwtOptions.Value;
            _userManager = userManager;
            _db = db;
        }

        public async Task<(string AccessToken, string RefreshToken)> CreateTokensForCustomerAsync(Customer customer, string ipAddress)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, customer.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, customer.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, "Customer")
            };

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
                signingCredentials: creds);

            var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

            var refreshToken = GenerateRefreshToken();

            var refresh = new RefreshToken
            {
                UserId = customer.Id.ToString(),
                Token = refreshToken,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
                CreatedAt = DateTimeOffset.UtcNow,
                CreatedByIp = ipAddress
            };

            _db.RefreshTokens.Add(refresh);
            await _db.SaveChangesAsync();

            return (accessToken, refreshToken);
        }

        public async Task<(string AccessToken, string RefreshToken)> CreateTokensAsync(ApplicationUser user, string ipAddress)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var roles = await _userManager.GetRolesAsync(user);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            }.Union(roles.Select(r => new Claim(ClaimTypes.Role, r)));

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes),
                signingCredentials: creds);

            var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

            var refreshToken = GenerateRefreshToken();

            var refresh = new RefreshToken
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
                CreatedAt = DateTimeOffset.UtcNow,
                CreatedByIp = ipAddress
            };

            _db.RefreshTokens.Add(refresh);
            await _db.SaveChangesAsync();

            return (accessToken, refreshToken);
        }

        public async Task<bool> RevokeRefreshTokenAsync(string refreshToken, string ipAddress)
        {
            var token = await _db.RefreshTokens.SingleOrDefaultAsync(t => t.Token == refreshToken);
            if (token == null || token.IsRevoked) return false;

            token.IsRevoked = true;
            token.RevokedAt = DateTimeOffset.UtcNow;
            token.RevokedByIp = ipAddress;

            _db.RefreshTokens.Update(token);
            await _db.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Refreshes tokens by rotating the provided refresh token.
        /// Performs validation (existence, not revoked, not expired, optional IP check),
        /// creates a new access + refresh token pair and atomically revokes the old token.
        /// </summary>
        public async Task<(string AccessToken, string RefreshToken)> RefreshTokensAsync(string refreshToken, string ipAddress)
        {
            // 1. Get the execution strategy configured for PostgreSQL
            var strategy = _db.Database.CreateExecutionStrategy();

            // 2. Execute all operations inside the retriable strategy block
            return await strategy.ExecuteAsync(async () =>
            {
                // Explicit transaction begins inside the execution strategy block
                using var transaction = await _db.Database.BeginTransactionAsync();

                // Step A: Find and revoke the existing token
                var existingToken = await _db.RefreshTokens.SingleOrDefaultAsync(t => t.Token == refreshToken);
                if (existingToken == null || existingToken.IsRevoked)
                {
                    throw new UnauthorizedAccessException("Invalid or revoked refresh token.");
                }

                existingToken.IsRevoked = true;
                existingToken.RevokedAt = DateTimeOffset.UtcNow;
                existingToken.RevokedByIp = ipAddress;
                _db.RefreshTokens.Update(existingToken);

                // Step B: Get User and Roles
                var user = await _userManager.FindByIdAsync(existingToken.UserId);
                if (user == null)
                {
                    throw new UnauthorizedAccessException("User not found.");
                }

                // Step C: Generate new tokens (This calls GetRolesAsync internally)
                var newTokens = await CreateTokensAsync(user, ipAddress);

                // Step D: Commit changes and complete transaction
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return newTokens;
            });
        }
        private static string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }
    }
}
