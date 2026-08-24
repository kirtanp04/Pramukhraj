using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Product
{
    [Table("ProductImages")]
    [Index(nameof(ProductId))]
    public class ProductImage
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        public Guid ProductId { get; set; }

        [ForeignKey(nameof(ProductId))]
        public Product Product { get; set; } = default!;

        [Required]
        public string ImageUrl { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? AltText { get; set; }

        public bool IsPrimary { get; set; }

        public int DisplayOrder { get; set; }
    }
}
