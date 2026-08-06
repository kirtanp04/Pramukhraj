using Microsoft.EntityFrameworkCore;
using pramukhraj.Entities.Product;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Cart
{
    [Table("CartItems")]
    [Index(nameof(CartId))]
    // Ensures the same product/variant combination isn't added as two separate rows; 
    // instead, the quantity should just be updated.
    [Index(nameof(CartId), nameof(ProductId), nameof(VariantId), IsUnique = true)]
    public class CartItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public Guid Id { get; set; }

        [Required]
        public Guid CartId { get; set; }

        [ForeignKey(nameof(CartId))]
        public Cart Cart { get; set; } = default!;

        [Required]
        public Guid ProductId { get; set; }

        [ForeignKey(nameof(ProductId))]
        public Product.Product Product { get; set; } = default!;

        // Nullable because the user might add a "Simple Product" with no variants
        public Guid? VariantId { get; set; }

        [ForeignKey(nameof(VariantId))]
        public ProductVariant? Variant { get; set; }

        [Required]
        public int Quantity { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedOn { get; set; } = DateTime.UtcNow;
    }
}
