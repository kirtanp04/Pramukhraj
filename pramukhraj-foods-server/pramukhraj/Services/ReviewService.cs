using FluentValidation;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Common;
using pramukhraj.DTOs.Product;
using pramukhraj.Entities;
using pramukhraj.Entities.Product;
using pramukhraj.Entities.Review;
using pramukhraj.Interfaces;
using System.Data.Common;
using static pramukhraj.Common.AdminActions;
using static pramukhraj.DTOs.Review.AdminReviewRequestResponse;
using static pramukhraj.Entities.Review.ReviewEnum;

namespace pramukhraj.Services
{
    public class ReviewService: IReviewService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<ReviewService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IValidatorManager _validatorManager;
        private readonly ICacheService _cache;
        private static readonly TimeSpan CacheExpiration = TimeSpan.FromMinutes(30);

        public ReviewService(AppDbContext db, ILogger<ReviewService> logger, IHttpContextAccessor httpContextAccessor, IValidatorManager validatorManager, ICacheService cache)
        {
            _db = db;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _validatorManager = validatorManager;
            _cache = cache;
        }

        public async Task<ApiResponse<string>>CreateAdminReviewAsync(CreateAdminReviewRequest request,CancellationToken cancellationToken = default)
        {
            if (request is null)
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid review request.",
                    Errors = "Review information is required."
                };
            }

            var validation = await _validatorManager.CreateAdminReviewRequest.ValidateAsync(request, cancellationToken);
            if (!validation.IsValid) return ValidationFailure.Validate<string>(validation, "Review validation failed.");

            try
            {
                var data = Common.Common.GetAdminClaimInfo(_httpContextAccessor);

                if (!data.Success)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = data.StatusCode,
                        Success = data.Success,
                        Message = data.Message,
                        Errors = data.Errors
                    };
                }

                if (request.ProductId.HasValue)
                {
                    var productExists = await _db.Products
                        .AsNoTracking()
                        .AnyAsync(
                            product => product.Id == request.ProductId.Value,
                            cancellationToken);

                    if (!productExists)
                    {
                        return new ApiResponse<string>
                        {
                            StatusCode = StatusCodes.Status404NotFound,
                            Success = false,
                            Message = "Product not found.",
                            Errors =
                                "The selected product does not exist or is no longer available."
                        };
                    }
                }

                var currentTime = DateTime.UtcNow;
                var reviewId = Guid.NewGuid();
                Guid? adminId = Guid.Parse(data.Data?.Id.ToString() ?? null);

                var review = new Review
                {
                    Id = reviewId,

                    // Admin creates brand testimonials only.
                    ReviewType = ReviewType.BrandTestimonial,

                    Source = request.Source,
                    Status = request.Status,

                    CustomerId = null,
                    CustomerName = request.CustomerName.Trim(),
                    CustomerCity = request.CustomerCity?.Trim(),

                    ProductId = request.ProductId,
                    OrderId = null,
                    OrderItemId = null,

                    Rating = request.Rating,
                    Title = request.Title?.Trim(),
                    Comment = request.Comment.Trim(),

                    // Admin-created testimonial is never a verified purchase.
                    IsVerifiedPurchase = false,

                    HasCustomerConsent = request.HasCustomerConsent,
                    IsFeatured = request.IsFeatured,
                    IsActive = request.IsActive,

                    CreatedByAdminId = adminId,

                    ModeratedByAdminId =
                        request.Status == ReviewStatus.Pending
                            ? null
                            : adminId,

                    ModeratedByAdminName =
                        request.Status == ReviewStatus.Pending
                            ? null
                            : string.IsNullOrWhiteSpace(data.Data?.UserName)
                            ? "Unknown Admin"
                            : data.Data.UserName.Trim(),

                    ModeratedOn =
                        request.Status == ReviewStatus.Pending
                            ? null
                            : currentTime,

                    CreatedOn = currentTime,
                    UpdatedOn = currentTime
                };

                var adminAction = new AdminAction
                {
                    Id = Guid.NewGuid(),
                    AdminId = adminId,

                    AdminName = string.IsNullOrWhiteSpace(data.Data?.UserName)
                        ? "Unknown Admin"
                        : data.Data.UserName.Trim(),

                    Module = AdminActionModules.Review,
                    Action = AdminActionTypes.Create,
                    EntityId = reviewId,
                    EntityName = review.CustomerName,

                    Description =
                        $"Created testimonial for '{review.CustomerName}'.",

                    CreatedOn = currentTime
                };

                _db.Reviews.Add(review);
                _db.AdminActions.Add(adminAction);

                // EF Core automatically uses one transaction for this call.
                await _db.SaveChangesAsync(cancellationToken);
                _cache.RemoveByPrefix(CacheKey.Reviews.AllPrefix);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status201Created,
                    Success = true,
                    Message = "Testimonial created successfully.",
                    Data = review.Id.ToString()
                };
            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogInformation(
                    "Creating the admin testimonial was cancelled.");

                throw;
            }
            catch (DbUpdateException exception)
            {
                _logger.LogError(
                    exception,
                    "Database update error occurred while creating an admin testimonial.");

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to create the testimonial.",
                    Errors =
                        "A database error occurred while saving the testimonial. Please try again."
                };
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while creating an admin testimonial.");

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to create the testimonial.",
                    Errors =
                        "A database error occurred while processing the testimonial. Please try again."
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while creating an admin testimonial.");

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to create the testimonial.",
                    Errors =
                        "An unexpected error occurred. Please try again later."
                };
            }
        }

        public async Task<ApiResponse<string>>UpdateAdminReviewAsync(Guid reviewId,UpdateAdminReviewRequest request,CancellationToken cancellationToken = default)
        {
            if (reviewId == Guid.Empty || request is null)
            {
                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid review request.",
                    Errors = "A valid review identifier and review information are required."
                };
            }

            var validation = await _validatorManager.UpdateAdminReviewRequest
                .ValidateAsync(request, cancellationToken);
            if (!validation.IsValid)
            {
                return ValidationFailure.Validate<string>(
                    validation,
                    "Review validation failed.");
            }

            try
            {
                var data = Common.Common.GetAdminClaimInfo(_httpContextAccessor);

                if (!data.Success)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = data.StatusCode,
                        Success = data.Success,
                        Message = data.Message,
                        Errors = data.Errors
                    };
                }

                Guid? adminId = Guid.Parse(data.Data?.Id.ToString() ?? null);
                string adminName = string.IsNullOrWhiteSpace(data.Data?.UserName)
                        ? "Unknown Admin"
                        : data.Data.UserName.Trim();

                var review = await _db.Reviews
                    .SingleOrDefaultAsync(
                        item => item.Id == reviewId,
                        cancellationToken);

                if (review is null)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Success = false,
                        Message = "Review not found.",
                        Errors =
                            "The requested review does not exist or has been removed."
                    };
                }

                // Customer-authored product reviews must not be silently edited.
                if (review.ReviewType != ReviewType.BrandTestimonial)
                {
                    return new ApiResponse<string>
                    {
                        StatusCode = StatusCodes.Status400BadRequest,
                        Success = false,
                        Message = "Product review content cannot be edited.",
                        Errors =
                            "Customer product reviews can only be approved, rejected, featured or disabled."
                    };
                }

                if (request.ProductId.HasValue)
                {
                    var productExists = await _db.Products
                        .AsNoTracking()
                        .AnyAsync(
                            product => product.Id == request.ProductId.Value,
                            cancellationToken);

                    if (!productExists)
                    {
                        return new ApiResponse<string>
                        {
                            StatusCode = StatusCodes.Status404NotFound,
                            Success = false,
                            Message = "Product not found.",
                            Errors =
                                "The selected product does not exist or is no longer available."
                        };
                    }
                }

               

                var currentTime = DateTime.UtcNow;
                var statusChanged = review.Status != request.Status;

                review.CustomerName = request.CustomerName.Trim();
                review.CustomerCity = request.CustomerCity?.Trim();
                review.ProductId = request.ProductId;

                review.Source = request.Source;
                review.Rating = request.Rating;
                review.Title = request.Title?.Trim();
                review.Comment = request.Comment.Trim();

                review.Status = request.Status;
                review.HasCustomerConsent = request.HasCustomerConsent;
                review.IsFeatured = request.IsFeatured;
                review.IsActive = request.IsActive;

                review.RejectionReason =
                    request.Status == ReviewStatus.Rejected
                        ? request.RejectionReason?.Trim()
                        : null;

                review.UpdatedOn = currentTime;

                if (statusChanged)
                {
                    review.ModeratedByAdminId = adminId;
                    review.ModeratedByAdminName = adminName;

                    review.ModeratedOn = currentTime;
                }

                var adminAction = new AdminAction
                {
                    Id = Guid.NewGuid(),
                    AdminId = adminId,

                    AdminName = adminName,

                    Module = AdminActionModules.Review,
                    Action = AdminActionTypes.Update,
                    EntityId = review.Id,
                    EntityName = review.CustomerName,

                    Description =
                        $"Updated testimonial for '{review.CustomerName}'.",

                    CreatedOn = currentTime
                };

                _db.AdminActions.Add(adminAction);

                await _db.SaveChangesAsync(cancellationToken);
                _cache.RemoveByPrefix(CacheKey.Reviews.AllPrefix);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = "Testimonial updated successfully.",
                    Data = review.Id.ToString()
                };
            }
            catch (OperationCanceledException)
                when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogInformation(
                    "Updating testimonial {ReviewId} was cancelled.",
                    reviewId);

                throw;
            }
            catch (DbUpdateConcurrencyException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Concurrency conflict occurred while updating testimonial {ReviewId}.",
                    reviewId);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status409Conflict,
                    Success = false,
                    Message = "The testimonial was changed by another request.",
                    Errors =
                        "Reload the latest testimonial information and try again."
                };
            }
            catch (DbUpdateException exception)
            {
                _logger.LogError(
                    exception,
                    "Database update error occurred while updating testimonial {ReviewId}.",
                    reviewId);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to update the testimonial.",
                    Errors =
                        "A database error occurred while saving the testimonial. Please try again."
                };
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while updating testimonial {ReviewId}.",
                    reviewId);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to update the testimonial.",
                    Errors =
                        "A database error occurred while processing the testimonial. Please try again."
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while updating testimonial {ReviewId}.",
                    reviewId);

                return new ApiResponse<string>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to update the testimonial.",
                    Errors =
                        "An unexpected error occurred. Please try again later."
                };
            }
        }

        public async Task<ApiResponse<AdminReviewDetailsResponse>> GetAdminReviewByIdAsync(
            string reviewId,
            CancellationToken cancellationToken = default)
        {
            if (!Guid.TryParse(reviewId, out var parsedReviewId) || parsedReviewId == Guid.Empty)
            {
                return new ApiResponse<AdminReviewDetailsResponse>
                {
                    StatusCode = StatusCodes.Status400BadRequest,
                    Success = false,
                    Message = "Invalid review identifier.",
                    Errors = "A valid review identifier is required."
                };
            }

            try
            {
                var review = await _cache.GetOrCreateAsync(
                    CacheKey.Reviews.Details(parsedReviewId),
                    token => _db.Reviews
                        .AsNoTracking()
                        .Where(item => item.Id == parsedReviewId)
                        .Select(item => new AdminReviewDetailsResponse
                        {
                            Id = item.Id.ToString(),
                            CustomerName = item.CustomerName,
                            CustomerCity = item.CustomerCity,
                            ProductId = item.ProductId.HasValue
                                ? item.ProductId.Value.ToString()
                                : null,
                            ProductName = item.Product != null ? item.Product.Name : null,
                            ReviewType = item.ReviewType,
                            Source = item.Source,
                            Rating = item.Rating,
                            Title = item.Title,
                            Comment = item.Comment,
                            Status = item.Status,
                            RejectionReason = item.RejectionReason,
                            HasCustomerConsent = item.HasCustomerConsent,
                            IsFeatured = item.IsFeatured,
                            IsActive = item.IsActive
                        })
                        .SingleOrDefaultAsync(token),
                    CacheExpiration,
                    size: 2,
                    cancellationToken);

                if (review is null)
                {
                    return new ApiResponse<AdminReviewDetailsResponse>
                    {
                        StatusCode = StatusCodes.Status404NotFound,
                        Success = false,
                        Message = "Review not found.",
                        Errors = "The requested review does not exist or has been removed."
                    };
                }

                return new ApiResponse<AdminReviewDetailsResponse>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = "Review retrieved successfully.",
                    Data = review
                };
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogInformation(
                    "Retrieving review {ReviewId} was cancelled.",
                    parsedReviewId);
                throw;
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while retrieving review {ReviewId}.",
                    parsedReviewId);

                return new ApiResponse<AdminReviewDetailsResponse>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the review.",
                    Errors = "A database error occurred while retrieving the review. Please try again."
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while retrieving review {ReviewId}.",
                    parsedReviewId);

                return new ApiResponse<AdminReviewDetailsResponse>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the review.",
                    Errors = "An unexpected error occurred. Please try again later."
                };
            }
        }

        public async Task<ApiResponse<List<AdminReviewListResponse>>> GetAllReviewListList(int pageNumber, CancellationToken cancellationToken = default)
        {
            const int pageSize = 10;
            try
            {
                pageNumber = Math.Max(pageNumber, 1);

                var skip = (pageNumber - 1) * pageSize;
                var timeZoneOffset = Common.Common.GetTimeZone(_httpContextAccessor);

                var reviews = await _cache.GetOrCreateAsync(
                    CacheKey.Reviews.List(pageNumber, timeZoneOffset),
                    token => _db.Reviews
                        .AsNoTracking()
                        .OrderByDescending(review => review.CreatedOn)
                        .Skip(skip)
                        .Take(pageSize)
                        .Select(r => new AdminReviewListResponse
                        {
                            CommentPreview = r.Comment.Length > 100 ? r.Comment.Substring(0, 100) + "..." : r.Comment,
                            CreatedOn = r.CreatedOn.AddMinutes(-timeZoneOffset).ToString("yyyy-MM-dd HH:mm:ss"),
                            CustomerCity = r.CustomerCity ?? string.Empty,
                            CustomerName = r.CustomerName ?? string.Empty,
                            ProductName = r.Product != null ? r.Product.Name ?? string.Empty : string.Empty,
                            ReviewType = r.ReviewType,
                            Source = r.Source,
                            Status = r.Status,
                            Rating = r.Rating,
                            Title = r.Title ?? string.Empty,
                            IsVerifiedPurchase = r.IsVerifiedPurchase,
                            IsFeatured = r.IsFeatured,
                            IsActive = r.IsActive,
                            Id = r.Id.ToString()
                        })
                        .ToListAsync(token),
                    CacheExpiration,
                    size: 10,
                    cancellationToken);

                _logger.LogInformation(
                    "Retrieved {reviewCount} reviews for page {PageNumber}.",
                    reviews.Count,
                    pageNumber);

                return new ApiResponse<List<AdminReviewListResponse>>
                {
                    StatusCode = StatusCodes.Status200OK,
                    Success = true,
                    Message = reviews.Count > 0
                        ? "Reviews retrieved successfully."
                        : "No reviews were found.",
                    Data = reviews
                };
            }
            catch (OperationCanceledException exception)
            when (cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(
                    exception,
                    "The admin review-list request was cancelled for page {PageNumber}.",
                    pageNumber);

                return new ApiResponse<List<AdminReviewListResponse>>
                {
                    StatusCode = StatusCodes.Status408RequestTimeout,
                    Success = false,
                    Message = "The review-list request was cancelled.",
                    Errors =
                        "The request was cancelled before the reviews could be retrieved. Please try again.",
                    Data = []
                };
            }
            catch (DbException exception)
            {
                _logger.LogError(
                    exception,
                    "Database error occurred while retrieving the admin review list for page {PageNumber}.",
                    pageNumber);

                return new ApiResponse<List<AdminReviewListResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the review list.",
                    Errors =
                        "A database error occurred while retrieving the reviews. Please try again.",
                    Data = []
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unexpected error occurred while retrieving the admin review list for page {PageNumber}.",
                    pageNumber);

                return new ApiResponse<List<AdminReviewListResponse>>
                {
                    StatusCode = StatusCodes.Status500InternalServerError,
                    Success = false,
                    Message = "Unable to retrieve the review list.",
                    Errors =
                        "An unexpected error occurred while retrieving the reviews. Please try again later.",
                    Data = []
                };
            }
        }

        public async Task<ApiResponse<List<CustomerTestimonialResponse>>> GetTopTestimonialsAsync(
            CancellationToken cancellationToken = default)
        {
            try
            {
                var testimonials = await _cache.GetOrCreateAsync(
                    CacheKey.Reviews.TopTestimonials,
                    token => _db.Reviews
                        .AsNoTracking()
                        .Where(review =>
                            review.ReviewType == ReviewType.BrandTestimonial &&
                            review.Status == ReviewStatus.Approved &&
                            review.IsFeatured &&
                            review.IsActive &&
                            review.HasCustomerConsent)
                        .OrderByDescending(review => review.Rating)
                        .ThenByDescending(review => review.CreatedOn)
                        .ThenByDescending(review => review.Id)
                        .Take(3)
                        .Select(review => new CustomerTestimonialResponse
                        {
                            Stars = review.Rating,
                            Message = review.Comment,
                            CustomerName = review.CustomerName,
                            Location = review.CustomerCity ?? string.Empty
                        })
                        .ToListAsync(token),
                    CacheExpiration,
                    size: 3,
                    cancellationToken);

                return ApiResponse<List<CustomerTestimonialResponse>>.Ok(
                    testimonials,
                    testimonials.Count > 0
                        ? "Testimonials retrieved successfully."
                        : "No testimonials were found.");
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (DbException exception)
            {
                _logger.LogError(exception, "Database error occurred while retrieving top testimonials.");
                return ApiResponse<List<CustomerTestimonialResponse>>.Fail(
                    "A database error occurred while retrieving testimonials. Please try again.",
                    StatusCodes.Status500InternalServerError);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Unexpected error occurred while retrieving top testimonials.");
                return ApiResponse<List<CustomerTestimonialResponse>>.Fail(
                    "An unexpected error occurred while retrieving testimonials. Please try again later.",
                    StatusCodes.Status500InternalServerError);
            }
        }

    }
}
