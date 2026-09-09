using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using static pramukhraj.Entities.Review.ReviewEnum;

namespace pramukhraj.Entities.Review
{
    [Table("Reviews")]
    [Index(
     nameof(ProductId),
     nameof(Status),
     nameof(IsActive),
     nameof(CreatedOn))]
    [Index(
     nameof(ReviewType),
     nameof(Status),
     nameof(IsFeatured),
     nameof(IsActive),
     nameof(CreatedOn))]
    [Index(nameof(CustomerId), nameof(CreatedOn))]
    [Index(nameof(OrderId))]
    [Index(nameof(OrderItemId), IsUnique = true)]
    public sealed class Review
    {
        [Key]
        public Guid Id { get; set; }

        // --------------------------------------------------
        // Review classification
        // --------------------------------------------------

        public ReviewType ReviewType { get; set; }

        public ReviewSource Source { get; set; }

        public ReviewStatus Status { get; set; } = ReviewStatus.Pending;

        // --------------------------------------------------
        // Customer information
        // --------------------------------------------------

        /// <summary>
        /// Null for testimonials created from offline sources.
        /// </summary>
        public Guid? CustomerId { get; set; }

        public Customer? Customer { get; set; }

        /// <summary>
        /// Snapshot of the customer name so the review remains
        /// displayable if the user changes or deletes their account.
        /// </summary>
        [Required]
        [MaxLength(120)]
        public string CustomerName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? CustomerCity { get; set; }

        // --------------------------------------------------
        // Product and purchase information
        // --------------------------------------------------

        /// <summary>
        /// Required for product reviews.
        /// Optional for general brand testimonials.
        /// </summary>
        public Guid? ProductId { get; set; }

        public Product.Product? Product { get; set; }

        /// <summary>
        /// Add Order navigation after the Order module exists.
        /// </summary>
        public Guid? OrderId { get; set; }

        /// <summary>
        /// Identifies the purchased order item.
        /// A unique index prevents multiple reviews for one order item.
        /// </summary>
        public Guid? OrderItemId { get; set; }

        // --------------------------------------------------
        // Review content
        // --------------------------------------------------

        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(150)]
        public string? Title { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Comment { get; set; } = string.Empty;


        // --------------------------------------------------
        // Trust and homepage controls
        // --------------------------------------------------

        /// <summary>
        /// Calculated by the server after validating the customer,
        /// delivered order, product and order item.
        /// </summary>
        public bool IsVerifiedPurchase { get; set; }

        /// <summary>
        /// Approved reviews marked as featured can appear as
        /// homepage testimonials.
        /// </summary>
        public bool IsFeatured { get; set; }

        /// <summary>
        /// Required before a testimonial can be published on the homepage.
        /// </summary>
        public bool HasCustomerConsent { get; set; }

        public bool IsActive { get; set; } = true;

        // --------------------------------------------------
        // Moderation information
        // --------------------------------------------------

        public Guid? ModeratedByAdminId { get; set; }

        [MaxLength(120)]
        public string? ModeratedByAdminName { get; set; }

        public DateTime? ModeratedOn { get; set; }

        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        // --------------------------------------------------
        // Audit information
        // --------------------------------------------------

        public Guid? CreatedByAdminId { get; set; }

        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedOn { get; set; } = DateTime.UtcNow;
    }
}
