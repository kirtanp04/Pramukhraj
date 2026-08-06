using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Cart
{
    [Table("Carts")]
    [Index(nameof(SessionId))]
    [Index(nameof(UserId))]
    public class Cart
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        // Nullable because a guest user won't have a UserId yet
        public Guid? UserId { get; set; }

        // Used to track the cart for unauthorized users before they log in
        [Required]
        [MaxLength(255)]
        public string SessionId { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedOn { get; set; } = DateTime.UtcNow;

        public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
    }
}
