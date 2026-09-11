using pramukhraj.Common;
using pramukhraj.DTOs.Review;
using static pramukhraj.DTOs.Review.AdminReviewRequestResponse;


namespace pramukhraj.Interfaces
{
    public interface IReviewService
    {
       public Task<ApiResponse<string>>CreateAdminReviewAsync(AdminReviewRequestResponse.CreateAdminReviewRequest request,CancellationToken cancellationToken = default);

       public Task<ApiResponse<string>>UpdateAdminReviewAsync(Guid reviewId, AdminReviewRequestResponse.UpdateAdminReviewRequest request,CancellationToken cancellationToken = default);

       public Task<ApiResponse<AdminReviewDetailsResponse>> GetAdminReviewByIdAsync(string reviewId, CancellationToken cancellationToken = default);

       public Task<ApiResponse<List<AdminReviewListResponse>>> GetAllReviewListList(int PageNumber, CancellationToken cancellationToken = default);

       public Task<ApiResponse<List<CustomerTestimonialResponse>>> GetTopTestimonialsAsync(CancellationToken cancellationToken = default);
    }
}
