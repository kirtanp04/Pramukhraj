using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Product
{
    [Table("ProductTags")]
    [Index(nameof(ProductId), nameof(Name), IsUnique = true)] // Prevents duplicate tags on the same product
    public class ProductTag
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        public Guid ProductId { get; set; }

        [ForeignKey(nameof(ProductId))]
        public Product Product { get; set; } = default!;

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
    }
}
