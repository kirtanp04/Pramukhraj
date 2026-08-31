using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Product
{
        [Table("Products")]
        [Index(nameof(Slug), IsUnique = true)]
        [Index(nameof(CategoryId))]
        public class Product
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public Guid Id { get; set; }

            [Required]
            public Guid CategoryId { get; set; }

            [ForeignKey(nameof(CategoryId))]
            public ProductCategory Category { get; set; } = default!;

            [Required]
            [MaxLength(255)]
            public string Name { get; set; } = string.Empty;

            [Required]
            [MaxLength(255)]
            public string Slug { get; set; } = string.Empty;

            [MaxLength(500)]
            public string ShortDescription { get; set; } = string.Empty;

            // No MaxLength defaults to Postgres 'text' type, good for long content
            public string Description { get; set; } = string.Empty;

            [MaxLength(100)]
            public string Brand { get; set; } = "Pramukhraj";

            public bool IsFeatured { get; set; }
            public bool IsBestSeller { get; set; }
            public bool IsTrending { get; set; }
            public bool IsNewArrival { get; set; }
            public bool IsActive { get; set; } = true;

            [MaxLength(100)]
            public string CountryOfOrigin { get; set; } = "India";

            public bool IsVegetarian { get; set; } = true;

            [MaxLength(100)]
            public string ShelfLife { get; set; } = string.Empty;

            [MaxLength(500)]
            public string StorageInstruction { get; set; } = string.Empty;

            public string Ingredients { get; set; } = string.Empty;

            public string NutritionalInformation { get; set; } = string.Empty;

            [MaxLength(100)]
            public string? Barcode { get; set; }

            [MaxLength(255)]
            public string? MetaTitle { get; set; }

            [MaxLength(500)]
            public string? MetaDescription { get; set; }

            [MaxLength(500)]
            public string? MetaKeywords { get; set; }

            public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

            public DateTime UpdatedOn { get; set; } = DateTime.UtcNow;

            public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
            public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
            public ICollection<ProductTag> Tags { get; set; } = new List<ProductTag>();
        }
}

// Disconted price (MRP-Price)/MRP * 100