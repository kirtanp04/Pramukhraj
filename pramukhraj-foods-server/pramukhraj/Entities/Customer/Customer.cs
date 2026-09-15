using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Customer
{
    [Table("Customers")]
    [Index(nameof(MobileNumber), IsUnique = true)]
    [Index(nameof(NormalizedEmail), IsUnique = true)]
    [Index(nameof(IsActive), nameof(IsDeleted))]
    [Index(nameof(CreatedOn))]
    public class Customer
    {
        [Key]
        public Guid Id { get; set; }

        // Always store in E.164 format: +919876543210
        [Required]
        [MaxLength(16)]
        public string MobileNumber { get; set; } = string.Empty;

        public bool IsMobileVerified { get; set; }

        [Required]
        [MaxLength(120)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(256)]
        public string? Email { get; set; }

        // Used for case-insensitive email lookup.
        [MaxLength(256)]
        public string? NormalizedEmail { get; set; }

        public bool IsEmailVerified { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [MaxLength(100)]
        public string? State { get; set; }

        [MaxLength(10)]
        public string? PostalCode { get; set; }

        public bool IsProfileCompleted { get; set; }

        public bool IsActive { get; set; } = true;

        public bool IsBlocked { get; set; }

        [MaxLength(500)]
        public string? BlockReason { get; set; }

        public DateTime? BlockedOn { get; set; }

        public bool MarketingConsent { get; set; }

        public DateTime? MarketingConsentOn { get; set; }

        public DateTime? LastLoginOn { get; set; }

        /*
         * Increment this value to invalidate all previously issued
         * customer access and refresh tokens.
         */
        public int TokenVersion { get; set; } = 1;

        public DateTime CreatedOn { get; set; }

        public DateTime UpdatedOn { get; set; }

        // Keep customer history referenced by orders.
        public bool IsDeleted { get; set; }

        public DateTime? DeletedOn { get; set; }

        [MaxLength(64)]
        [ConcurrencyCheck]
        public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString("N");

        public ICollection<CustomerRefreshTokens> RefreshTokens { get; set; } = [];

        public ICollection<CustomerAddresses> Addresses { get; set; } = [];

        public ICollection<Cart.Cart> Carts { get; set; } = [];
    }
}
