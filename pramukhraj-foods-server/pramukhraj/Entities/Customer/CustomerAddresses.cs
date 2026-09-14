using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Customer
{
    [Table("CustomerAddresses")]
    [Index(nameof(CustomerId))]
    [Index(nameof(CustomerId), nameof(IsDefaultShipping))]
    public class CustomerAddresses
    {
        [Key]
        public Guid Id { get; set; }

        public Guid CustomerId { get; set; }

        [Required]
        [MaxLength(120)]
        public string RecipientName { get; set; } = string.Empty;

        [Required]
        [MaxLength(16)]
        public string MobileNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(250)]
        public string AddressLine1 { get; set; } = string.Empty;

        [MaxLength(250)]
        public string? AddressLine2 { get; set; }

        [Required]
        [MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string State { get; set; } = string.Empty;

        [Required]
        [MaxLength(10)]
        public string PostalCode { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? Landmark { get; set; }

        public CustomerAddressType AddressType { get; set; }

        public bool IsDefaultShipping { get; set; }

        public bool IsDefaultBilling { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedOn { get; set; }

        public DateTime UpdatedOn { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public Customer Customer { get; set; } = null!;
    }

    public enum CustomerAddressType
    {
        Home = 1,
        Work = 2,
        Other = 3
    }
}
