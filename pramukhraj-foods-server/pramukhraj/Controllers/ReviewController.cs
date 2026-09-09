using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using pramukhraj.Interfaces;
using static pramukhraj.DTOs.Review.AdminReviewRequestResponse;

namespace pramukhraj.Controllers
{
    [Route("api/review")]
    [ApiController]
    [EnableRateLimiting("rate-limit")]
    public class ReviewController : ControllerBase
    {
        private readonly IServiceManager _serviceManager;

        public ReviewController(IServiceManager serviceManager)
        {
            _serviceManager = serviceManager;
        }

        [HttpPost("admin/add")]
        [Authorize]
        public async Task<IActionResult> CreateReview([FromBody] CreateAdminReviewRequest request,CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ReviewService
                .CreateAdminReviewAsync(
                    request,
                    cancellationToken);

            return StatusCode(response.StatusCode, response);
        }

        [HttpPut("admin/{reviewId}")]
        [Authorize]
        public async Task<IActionResult> UpdateReview(string reviewId,[FromBody] UpdateAdminReviewRequest request,CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ReviewService
                .UpdateAdminReviewAsync(
                    Guid.Parse(reviewId),
                    request,
                    cancellationToken);

            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("admin/{reviewId}")]
        [Authorize]
        public async Task<IActionResult> GetReviewById(
            string reviewId,
            CancellationToken cancellationToken)
        {
            var response = await _serviceManager.ReviewService
                .GetAdminReviewByIdAsync(reviewId, cancellationToken);

            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("admin/get-list/{pageNumber:int?}")]
        [Authorize]
        public async Task<IActionResult> GetReviewListList([FromRoute] int? pageNumber, CancellationToken cancellationToken)
        {
            var productPage = pageNumber.GetValueOrDefault(0);

            if (productPage < 0)
            {
                productPage = 0;
            }

            var response = await _serviceManager.ReviewService.GetAllReviewListList(
                productPage,
                cancellationToken);

            return StatusCode(response.StatusCode, response);
        }
    }
}
