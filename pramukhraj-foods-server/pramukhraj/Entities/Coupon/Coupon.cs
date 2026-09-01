using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static pramukhraj.Entities.Coupon.CouponEnums;

namespace pramukhraj.Entities.Coupon
{
    [Table("Coupons")]
    [Index(nameof(Code), IsUnique = true)]
    [Index(
    nameof(IsActive),
    nameof(StartOn),
    nameof(EndOn))]
    public class Coupon
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public CouponDiscountType DiscountType { get; set; }

        public CouponApplicationScope ApplicationScope { get; set; } = CouponApplicationScope.AllProducts;

        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountValue { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MinimumOrderAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MaximumDiscountAmount { get; set; }

        /// <summary>
        /// Maximum successful redemptions across all customers.
        /// Null means unlimited.
        /// </summary>
        public int? TotalUsageLimit { get; set; }

        /// <summary>
        /// Maximum successful redemptions by one customer.
        /// Null means unlimited.
        /// </summary>
        public int? PerCustomerUsageLimit { get; set; }

        public bool IsFirstOrderOnly { get; set; }

        public bool CanCombineWithOtherDiscounts { get; set; }

        public DateTime StartOn { get; set; }

        public DateTime EndOn { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime? DeletedOn { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedOn { get; set; } = DateTime.UtcNow;

        public ICollection<CouponScope> Scopes { get; set; }
            = [];

        public ICollection<CouponUsage> Usages { get; set; }
            = [];
    }
}
