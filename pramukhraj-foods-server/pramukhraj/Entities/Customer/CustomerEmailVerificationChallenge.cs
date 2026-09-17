using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Customer;

[Table("CustomerEmailVerificationChallenges")]
[Index(nameof(CustomerId), nameof(NormalizedEmail), nameof(CreatedOn))]
[Index(nameof(ExpiresOn))]
public sealed class CustomerEmailVerificationChallenge
{
    [Key] public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    [Required, MaxLength(256)] public string NormalizedEmail { get; set; } = string.Empty;
    [Required, MaxLength(128)] public string CodeHash { get; set; } = string.Empty;
    public int FailedAttempts { get; set; }
    public int MaxAttempts { get; set; } = 5;
    public DateTime ExpiresOn { get; set; }
    public DateTime? VerifiedOn { get; set; }
    public DateTime? ConsumedOn { get; set; }
    public DateTime CreatedOn { get; set; }
    [MaxLength(64)] public string? RequestIpHash { get; set; }
    [ForeignKey(nameof(CustomerId))] public Customer Customer { get; set; } = null!;
}
