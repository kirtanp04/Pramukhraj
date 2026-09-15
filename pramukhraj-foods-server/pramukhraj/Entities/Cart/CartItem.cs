using Microsoft.EntityFrameworkCore;
using pramukhraj.Entities.Product;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Cart
{
    [Table("CartItems")]
    [Index(nameof(CartId))]
    [Index(nameof(ProductVariantId))]
    [Index(nameof(CartId), nameof(ProductVariantId), IsUnique = true)]
    public class CartItem
    {
        [Key]
        public Guid Id { get; set; }

        public Guid CartId { get; set; }

        /*
         * Cart should reference the exact purchasable variant,
         * such as 200 g or 500 g.
         */
        public Guid ProductVariantId { get; set; }

        public int Quantity { get; set; }

        /*
         * Optional but useful if customers can choose which
         * cart items should be included in checkout.
         */
        public bool IsSelected { get; set; } = true;

        public DateTime CreatedOn { get; set; }

        public DateTime UpdatedOn { get; set; }

        [ForeignKey(nameof(CartId))]
        public Cart Cart { get; set; } = default!;

        [ForeignKey(nameof(ProductVariantId))]
        public ProductVariant ProductVariant { get; set; } = default!;
    }
}
