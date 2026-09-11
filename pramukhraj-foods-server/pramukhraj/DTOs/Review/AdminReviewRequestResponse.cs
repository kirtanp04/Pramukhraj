using static pramukhraj.Entities.Review.ReviewEnum;

namespace pramukhraj.DTOs.Review
{
    public class AdminReviewRequestResponse
    {
        public  class CreateAdminReviewRequest
        {
            public string CustomerName { get; set; } = string.Empty;
            public string? CustomerCity { get; set; }
            // Optional: testimonial can be associated with a product.
            public Guid? ProductId { get; set; }
            public ReviewSource Source { get; set; }
            public int Rating { get; set; }
            public string? Title { get; set; }
            public string Comment { get; set; } = string.Empty;
            public ReviewStatus Status { get; set; } = ReviewStatus.Approved;
            public bool HasCustomerConsent { get; set; }
            public bool IsFeatured { get; set; }
            public bool IsActive { get; set; } = true;
        }

        public  class UpdateAdminReviewRequest
        {
            public string CustomerName { get; set; } = string.Empty;
            public string? CustomerCity { get; set; }
            public Guid? ProductId { get; set; }
            public ReviewSource Source { get; set; }
            public int Rating { get; set; }
            public string? Title { get; set; }
            public string Comment { get; set; } = string.Empty;
            public string? SourceReference { get; set; }
            public ReviewStatus Status { get; set; }
            public string? RejectionReason { get; set; }
            public bool HasCustomerConsent { get; set; }
            public bool IsFeatured { get; set; }
            public bool IsActive { get; set; }

        }

        public sealed class AdminReviewDetailsResponse
        {
            public string Id { get; set; } = string.Empty;
            public string CustomerName { get; set; } = string.Empty;
            public string? CustomerCity { get; set; }
            public string? ProductId { get; set; }
            public string? ProductName { get; set; }
            public ReviewType ReviewType { get; set; }
            public ReviewSource Source { get; set; }
            public int Rating { get; set; }
            public string? Title { get; set; }
            public string Comment { get; set; } = string.Empty;
            public string? SourceReference { get; set; }
            public ReviewStatus Status { get; set; }
            public string? RejectionReason { get; set; }
            public bool HasCustomerConsent { get; set; }
            public bool IsFeatured { get; set; }
            public bool IsActive { get; set; }
        }

        public sealed class AdminReviewListResponse
        {
            public string Id { get; set; } = string.Empty;
            public string CustomerName { get; set; } = string.Empty;
            public string CustomerCity { get; set; } = string.Empty;
            public string ProductName { get; set; } = string.Empty;
            public ReviewType ReviewType { get; set; }
            public ReviewSource Source { get; set; }
            public ReviewStatus Status { get; set; }
            public int Rating { get; set; }
            public string Title { get; set; } = string.Empty;
            public string CommentPreview { get; set; } = string.Empty;
            public bool IsVerifiedPurchase { get; set; }
            public bool IsFeatured { get; set; }
            public bool IsActive { get; set; }
            public string CreatedOn { get; set; } = string.Empty;

        }

        public sealed class CustomerTestimonialResponse
        {
            public int Stars { get; set; }
            public string Message { get; set; } = string.Empty;
            public string CustomerName { get; set; } = string.Empty;
            public string Location { get; set; } = string.Empty;
        }
    }
}
