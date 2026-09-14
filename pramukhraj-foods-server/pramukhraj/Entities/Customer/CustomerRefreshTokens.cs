using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Customer
{
    [Table("CustomerRefreshTokens")]
    [Index(nameof(TokenHash), IsUnique = true)]
    [Index(nameof(CustomerId), nameof(ExpiresOn))]
    public class CustomerRefreshTokens
    {
        [Key]
        public Guid Id { get; set; }

        public Guid CustomerId { get; set; }

        // Store only a cryptographic hash of the token.
        [Required]
        [MaxLength(128)]
        public string TokenHash { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? DeviceName { get; set; }

        [MaxLength(64)]
        public string? IpAddressHash { get; set; }

        public DateTime CreatedOn { get; set; }

        public DateTime ExpiresOn { get; set; }

        public DateTime? RevokedOn { get; set; }

        [MaxLength(128)]
        public string? ReplacedByTokenHash { get; set; }

        public bool IsActive =>
            RevokedOn is null &&
            ExpiresOn > DateTime.UtcNow;

        [ForeignKey(nameof(CustomerId))]
        public Customer Customer { get; set; } = null!;
    }
}
