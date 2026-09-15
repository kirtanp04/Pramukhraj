using Microsoft.EntityFrameworkCore;
using pramukhraj.Entities.Customer;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace pramukhraj.Entities.Cart
{
    [Table("Carts")]
    [Index(nameof(CustomerId))]
    [Index(nameof(Status), nameof(UpdatedOn))]
    public class Cart
    {
        [Key]
        public Guid Id { get; set; }

        public Guid CustomerId { get; set; }

        public CartStatus Status { get; set; } = CartStatus.Active;

        /*
         * Incremented whenever the cart changes.
         * Useful for detecting stale checkout requests.
         */
        public int Version { get; set; } = 1;

        public DateTime CreatedOn { get; set; }

        public DateTime UpdatedOn { get; set; }

        public DateTime? ConvertedToOrderOn { get; set; }

        /*
         * Old abandoned carts can be removed or archived
         * by a background cleanup service.
         */
        public DateTime? ExpiresOn { get; set; }

        [MaxLength(64)]
        [ConcurrencyCheck]
        public string ConcurrencyStamp { get; set; } = Guid.NewGuid().ToString("N");

        [MaxLength(64)]
        public string? LastMergeRequestId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public Customer.Customer Customer { get; set; } = default!;

        public ICollection<CartItem> Items { get; set; } = [];
    }

    public enum CartStatus
    {
        Active = 1,
        Converted = 2,
        Abandoned = 3
    }
}

/*
 * CART STATUS:
 * Active    = Current editable cart. Only one active cart is allowed per customer.
 * Converted = Cart was successfully converted into an order and cannot be reused.
 * Abandoned = Cart expired because it was inactive for a configured period.
 *
 * Example:
 * Customer adds products  -> Active
 * Order is created        -> Converted
 * No activity for 30 days -> Abandoned
 *
 * CART VERSION:
 * Version prevents stale or concurrent cart updates. Increment it whenever an
 * item is added, removed, updated, selected, or a coupon is changed.
 *
 * Example:
 * Tab A and Tab B load cart Version 5.
 * Tab A updates quantity, changing Version 5 to 6.
 * Tab B submits Version 5, so the API returns 409 Conflict and reloads the cart.
 *
 * Configure Version with IsConcurrencyToken(). During checkout, compare the
 * submitted version with the current version, then revalidate prices, coupons,
 * product status, variant status, and stock before creating the order.
 */
