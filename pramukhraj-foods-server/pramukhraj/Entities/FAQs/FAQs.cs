using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static pramukhraj.Entities.FAQs.FAQsEnum;

namespace pramukhraj.Entities.FAQs
{
    [Table("Faqs")]
    [Index(
    nameof(Category),
    nameof(IsDeleted),
    nameof(IsActive),
    nameof(DisplayOrder))]
    [Index(
    nameof(IsDeleted),
    nameof(IsActive),
    nameof(IsFeatured),
    nameof(DisplayOrder))]
    [Index(
    nameof(Category),
    nameof(NormalizedQuestion),
    IsUnique = true)]
    public class FAQs
    {
        [Key]
        public Guid Id { get; set; }

        public FaqCategory Category { get; set; }

        [Required]
        [MaxLength(500)]
        public string Question { get; set; } = string.Empty;

        /// <summary>
        /// Server-generated normalized question used for duplicate detection.
        /// Never accept this value directly from an API request.
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string NormalizedQuestion { get; set; } = string.Empty;

        [Required]
        [MaxLength(5000)]
        public string Answer { get; set; } = string.Empty;

        /// <summary>
        /// Controls position within the selected category.
        /// Lower values appear first.
        /// </summary>
        public int DisplayOrder { get; set; }

        /// <summary>
        /// Featured FAQs can appear on the homepage or contact page.
        /// </summary>
        public bool IsFeatured { get; set; }

        /// <summary>
        /// Controls whether customers can currently see the FAQ.
        /// </summary>
        public bool IsActive { get; set; } = true;

        
        public DateTime CreatedOn { get; set; } =
            DateTime.UtcNow;

        public DateTime UpdatedOn { get; set; } =
            DateTime.UtcNow;

    }
}
