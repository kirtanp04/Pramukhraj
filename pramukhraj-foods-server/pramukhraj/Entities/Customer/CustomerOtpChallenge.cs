using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Customer
{
    [Table("CustomerOtpChallenges")]
    [Index(nameof(MobileNumber), nameof(Purpose))]
    [Index(nameof(ExpiresOn))]
    public class CustomerOtpChallenge
    {
        [Key]
        public Guid Id { get; set; }

        // Customer is null when the mobile belongs to a new customer.
        public Guid? CustomerId { get; set; }

        [Required]
        [MaxLength(16)]
        public string MobileNumber { get; set; } = string.Empty;

        // Never store the plain OTP.
        [Required]
        [MaxLength(128)]
        public string OtpHash { get; set; } = string.Empty;

        public CustomerOtpPurpose Purpose { get; set; }

        public int FailedAttempts { get; set; }

        public int MaxAttempts { get; set; } = 5;

        public DateTime ExpiresOn { get; set; }

        public DateTime? VerifiedOn { get; set; }

        public DateTime? ConsumedOn { get; set; }

        public DateTime CreatedOn { get; set; }

        [MaxLength(64)]
        public string? RequestIpHash { get; set; }

        public Customer? Customer { get; set; }
    }


    public enum CustomerOtpPurpose
    {
        Authentication = 1,
        ChangeMobileNumber = 2
    }
}

//A challenge is valid only when:

//challenge.ConsumedOn is null &&
//challenge.VerifiedOn is null &&
//challenge.ExpiresOn > DateTime.UtcNow &&
//challenge.FailedAttempts < challenge.MaxAttempts