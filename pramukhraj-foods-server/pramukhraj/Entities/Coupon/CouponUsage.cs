using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static pramukhraj.Entities.Coupon.CouponEnums;

namespace pramukhraj.Entities.Coupon
{
    [Table("CouponUsages")]
    [Index(nameof(CouponId), nameof(CustomerId))]
    public class CouponUsage
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        public Guid CouponId { get; set; }

        /// <summary>
        /// Null only when guest checkout is supported.
        /// This must match your customer user ID type.
        /// </summary>
        public Guid? CustomerId { get; set; }

        /// <summary>
        /// Order FK can be configured when the Order entity is created.
        /// </summary>
        public Guid? OrderId { get; set; }

        [Required]
        [MaxLength(50)]
        public string CouponCode { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal OrderSubtotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; }

        public CouponUsageStatus Status { get; set; } = CouponUsageStatus.Reserved;

        public DateTime? ReservationExpiresOn { get; set; }

        public DateTime? RedeemedOn { get; set; }

        public DateTime? ReleasedOn { get; set; }

        [MaxLength(500)]
        public string? ReleaseReason { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(CouponId))]
        public Coupon Coupon { get; set; } = null!;
    }
}
