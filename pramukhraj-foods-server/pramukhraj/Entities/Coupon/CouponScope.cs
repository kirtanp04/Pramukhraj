using pramukhraj.Entities.Product;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static pramukhraj.Entities.Coupon.CouponEnums;

namespace pramukhraj.Entities.Coupon
{
    [Table("CouponScopes")]
    public class CouponScope
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        public Guid CouponId { get; set; }

        public CouponScopeType ScopeType { get; set; }

        public Guid? ProductId { get; set; }

        public Guid? CategoryId { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(CouponId))]
        public Coupon Coupon { get; set; } = null!;

        [ForeignKey(nameof(ProductId))]
        public Product.Product? Product { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public ProductCategory? Category { get; set; }
    }
}
