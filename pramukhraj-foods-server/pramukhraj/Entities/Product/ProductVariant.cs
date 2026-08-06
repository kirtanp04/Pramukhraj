using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Product
{
    [Table("ProductVariants")]
    [Index(nameof(ProductId))]
    [Index(nameof(SKU), IsUnique = true)] // Ensure Variant SKUs are unique
    public class ProductVariant
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        public Guid ProductId { get; set; }

        [ForeignKey(nameof(ProductId))]
        public Product Product { get; set; } = default!;

        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string SKU { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MRP { get; set; }

        public int StockQuantity { get; set; }

        [Column(TypeName = "decimal(10,3)")]
        public decimal Weight { get; set; }

        [MaxLength(20)]
        public string WeightUnit { get; set; } = "gm";

        public bool IsDefault { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
