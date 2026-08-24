using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities
{
    [Table("AdminActions")]
    public class AdminAction
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Admin/User ID who performed the action.
        /// </summary>
        public Guid? AdminId { get; set; }

        /// <summary>
        /// Display name of the admin.
        /// </summary>
        [Required]
        [MaxLength(150)]
        public string AdminName { get; set; } = string.Empty;

        /// <summary>
        /// Module where action occurred.
        /// Example: Product, Category, Order, User
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Module { get; set; } = string.Empty;

        /// <summary>
        /// Action performed.
        /// Example: Create, Update, Delete, Activate
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Action { get; set; } = string.Empty;

        /// <summary>
        /// ID of affected entity.
        /// Example: ProductId, CategoryId
        /// </summary>
        public Guid? EntityId { get; set; }

        /// <summary>
        /// Human-readable name of affected entity.
        /// Example: "Masala Peanuts"
        /// </summary>
        [MaxLength(250)]
        public string? EntityName { get; set; }

        /// <summary>
        /// Optional additional description.
        /// </summary>
        [MaxLength(1000)]
        public string? Description { get; set; }

        /// <summary>
        /// UTC timestamp of action.
        /// </summary>
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    }
}