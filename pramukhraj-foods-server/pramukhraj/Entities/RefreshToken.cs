using System;
using System.ComponentModel.DataAnnotations;

namespace pramukhraj.Entities
{
    /// <summary>
    /// Refresh token entity for storing issued refresh tokens and their status.
    /// </summary>
    public sealed class RefreshToken
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public string UserId { get; set; } = string.Empty;

        public string Token { get; set; } = string.Empty;

        public DateTimeOffset ExpiresAt { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        public string? CreatedByIp { get; set; }

        public bool IsRevoked { get; set; }

        public DateTimeOffset? RevokedAt { get; set; }

        public string? RevokedByIp { get; set; }

        public string? ReplacedByToken { get; set; }
    }
}
