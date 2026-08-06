using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Product
{
    [Table("ProductCategories")]
    [Index(nameof(Slug), IsUnique = true)]
    [Index(nameof(ParentCategoryId))]
    public class ProductCategory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Slug { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public Guid? ParentCategoryId { get; set; }

        [ForeignKey(nameof(ParentCategoryId))]
        public ProductCategory? ParentCategory { get; set; }

        public ICollection<ProductCategory> Children { get; set; } = new List<ProductCategory>();

        public int DisplayOrder { get; set; }
        public bool IsFeatured { get; set; }
        public bool IsActive { get; set; } = true;

        [MaxLength(255)]
        public string? MetaTitle { get; set; }

        [MaxLength(500)]
        public string? MetaDescription { get; set; }

        [MaxLength(500)]
        public string? MetaKeywords { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedOn { get; set; } = DateTime.UtcNow;
    }
}
