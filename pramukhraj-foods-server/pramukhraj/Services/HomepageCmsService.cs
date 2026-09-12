using System.Data.Common;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.HomepageCms;
using pramukhraj.Entities;
using pramukhraj.Interfaces;
using static pramukhraj.Common.AdminActions;

namespace pramukhraj.Services;

public sealed class HomepageCmsService : IHomepageCmsService
{
    private const int HomepageId = 1;
    private static readonly TimeSpan CustomerCacheExpiration = TimeSpan.FromMinutes(30);

    private readonly AppDbContext _db;
    private readonly ILogger<HomepageCmsService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IValidatorManager _validatorManager;
    private readonly ICacheService _cache;

    public HomepageCmsService(
        AppDbContext db,
        ILogger<HomepageCmsService> logger,
        IHttpContextAccessor httpContextAccessor,
        IValidatorManager validatorManager,
        ICacheService cache)
    {
        _db = db;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
        _validatorManager = validatorManager;
        _cache = cache;
    }

    public async Task<ApiResponse<AdminHomepageCmsResponse>> GetAdminAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var homepage = await _db.HomepageCms
                .AsNoTracking()
                .Where(item => item.Id == HomepageId)
                .Select(item => new AdminHomepageCmsResponse
                {
                    Id = item.Id,
                    EyebrowBadge = item.EyebrowBadge,
                    Headline = item.Headline,
                    Subtext = item.Subtext,
                    HeroImageBase64 = item.HeroImageUrl,
                    HeroImageAltText = item.HeroImageAltText,
                    HappyCustomersCount = item.HappyCustomersCount ?? string.Empty,
                    HappyCustomersLabel = item.HappyCustomersLabel ?? string.Empty,
                    ProductCount = item.ProductCount ?? string.Empty,
                    ProductCountLabel = item.ProductCountLabel ?? string.Empty,
                    AverageRating = item.AverageRating ?? string.Empty,
                    AverageRatingLabel = item.AverageRatingLabel ?? string.Empty,
                    ShowShopByCategory = item.ShowShopByCategory,
                    ShowFeaturedProducts = item.ShowFeaturedProducts,
                    ShowTrendingProducts = item.ShowTrendingProducts,
                    ShowBestSellerProducts = item.ShowBestSellerProducts,
                    ShowNewArrivalProducts = item.ShowNewArrivalProducts,
                    ShowCustomerTestimonials = item.ShowCustomerTestimonials,
                    ShowFaqSection = item.ShowFaqSection,
                    CreatedOn = item.CreatedOn,
                    UpdatedOn = item.UpdatedOn
                })
                .SingleOrDefaultAsync(cancellationToken);

            return ApiResponse<AdminHomepageCmsResponse>.Ok(
                homepage ?? CreateDefaultAdminResponse(),
                homepage is null
                    ? "Homepage CMS has not been published yet. Default values were returned."
                    : "Homepage CMS retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error occurred while retrieving homepage CMS content.");
            return DatabaseFailure<AdminHomepageCmsResponse>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error occurred while retrieving homepage CMS content.");
            return UnexpectedFailure<AdminHomepageCmsResponse>();
        }
    }

    public async Task<ApiResponse<int>> ReplaceAsync(
        HomepageCmsWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return ApiResponse<int>.Fail("Homepage CMS details are required.", StatusCodes.Status400BadRequest);

        var validation = await _validatorManager.HomepageCmsWriteRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<int>(validation);

        var admin = GetAdmin();
        if (!admin.Success)
            return ApiResponse<int>.Fail(admin.Message, admin.StatusCode, admin.Errors);

        try
        {
            var previousEntryExists = false;
            var executionStrategy = _db.Database.CreateExecutionStrategy();

            await executionStrategy.ExecuteAsync(async () =>
            {
                // A retry can reuse this DbContext after a failed attempt. Clear
                // tracked inserts before starting the whole transaction again.
                _db.ChangeTracker.Clear();

                await using var transaction = await _db.Database
                    .BeginTransactionAsync(cancellationToken);

                previousEntryExists = await _db.HomepageCms
                    .AsNoTracking()
                    .AnyAsync(cancellationToken);

                if (previousEntryExists)
                    await _db.HomepageCms.ExecuteDeleteAsync(cancellationToken);

                var now = DateTime.UtcNow;
                var homepage = new HomepageCMS
                {
                    Id = HomepageId,
                    EyebrowBadge = request.EyebrowBadge.Trim(),
                    Headline = request.Headline.Trim(),
                    Subtext = request.Subtext.Trim(),
                    HeroImageUrl = request.HeroImageBase64?.Trim() ?? string.Empty,
                    HeroImageAltText = request.HeroImageAltText.Trim(),
                    HappyCustomersCount = NullIfWhiteSpace(request.HappyCustomersCount),
                    HappyCustomersLabel = NullIfWhiteSpace(request.HappyCustomersLabel),
                    ProductCount = NullIfWhiteSpace(request.ProductCount),
                    ProductCountLabel = NullIfWhiteSpace(request.ProductCountLabel),
                    AverageRating = NullIfWhiteSpace(request.AverageRating),
                    AverageRatingLabel = NullIfWhiteSpace(request.AverageRatingLabel),
                    ShowShopByCategory = request.ShowShopByCategory,
                    ShowFeaturedProducts = request.ShowFeaturedProducts,
                    ShowTrendingProducts = request.ShowTrendingProducts,
                    ShowBestSellerProducts = request.ShowBestSellerProducts,
                    ShowNewArrivalProducts = request.ShowNewArrivalProducts,
                    ShowCustomerTestimonials = request.ShowCustomerTestimonials,
                    ShowFaqSection = request.ShowFaqSection,
                    CreatedOn = now,
                    UpdatedOn = now
                };

                await _db.HomepageCms.AddAsync(homepage, cancellationToken);
                await _db.AdminActions.AddAsync(new AdminAction
                {
                    Id = Guid.NewGuid(),
                    AdminId = admin.Id,
                    AdminName = admin.Name,
                    Module = AdminActionModules.HomepageCms,
                    Action = previousEntryExists ? AdminActionTypes.Update : AdminActionTypes.Create,
                    EntityName = "Homepage CMS",
                    Description = previousEntryExists
                        ? "Replaced the homepage CMS content."
                        : "Published the homepage CMS content.",
                    CreatedOn = now
                }, cancellationToken);

                await _db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            });

            InvalidateCustomerHomepageCaches();

            return new ApiResponse<int>
            {
                Success = true,
                StatusCode = previousEntryExists
                    ? StatusCodes.Status200OK
                    : StatusCodes.Status201Created,
                Message = previousEntryExists
                    ? "Homepage CMS updated successfully."
                    : "Homepage CMS published successfully.",
                Data = HomepageId
            };
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbUpdateException exception)
        {
            _logger.LogError(exception, "Database update error occurred while replacing homepage CMS content.");
            return DatabaseFailure<int>();
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error occurred while replacing homepage CMS content.");
            return DatabaseFailure<int>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error occurred while replacing homepage CMS content.");
            return UnexpectedFailure<int>();
        }
    }

    public async Task<ApiResponse<CustomerHomepageHeroResponse>> GetCustomerHeroAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var hero = await _cache.GetOrCreateAsync(
                CacheKey.HomepageCms.CustomerHero,
                async token => await _db.HomepageCms
                    .AsNoTracking()
                    .Where(item => item.Id == HomepageId)
                    .Select(item => new CustomerHomepageHeroResponse
                    {
                        EyebrowBadge = item.EyebrowBadge,
                        Headline = item.Headline,
                        Subtext = item.Subtext,
                        HeroImageBase64 = item.HeroImageUrl,
                        HeroImageAltText = item.HeroImageAltText,
                        HappyCustomersCount = item.HappyCustomersCount,
                        HappyCustomersLabel = item.HappyCustomersLabel,
                        ProductCount = item.ProductCount,
                        ProductCountLabel = item.ProductCountLabel,
                        AverageRating = item.AverageRating,
                        AverageRatingLabel = item.AverageRatingLabel
                    })
                    .SingleOrDefaultAsync(token) ?? CreateDefaultCustomerResponse(),
                CustomerCacheExpiration,
                size: 1,
                cancellationToken);

            return ApiResponse<CustomerHomepageHeroResponse>.Ok(hero, "Homepage hero retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error occurred while retrieving the customer homepage hero.");
            return DatabaseFailure<CustomerHomepageHeroResponse>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error occurred while retrieving the customer homepage hero.");
            return UnexpectedFailure<CustomerHomepageHeroResponse>();
        }
    }

    private (bool Success, Guid Id, string Name, int StatusCode, string Message, object? Errors) GetAdmin()
    {
        var result = Common.Common.GetAdminClaimInfo(_httpContextAccessor);
        if (!result.Success || result.Data is null ||
            !Guid.TryParse(result.Data.Id, out var id) || id == Guid.Empty)
        {
            return (
                false,
                Guid.Empty,
                string.Empty,
                result.StatusCode == 0 ? StatusCodes.Status401Unauthorized : result.StatusCode,
                result.Message ?? "Authenticated administrator information was not found.",
                result.Errors);
        }

        return (true, id, result.Data.UserName?.Trim() ?? "Unknown Admin", StatusCodes.Status200OK, string.Empty, null);
    }

    private static AdminHomepageCmsResponse CreateDefaultAdminResponse() => new()
    {
        Id = HomepageId,
        EyebrowBadge = "Since 1997 · Gujarat",
        Headline = "Traditional taste, modern shopping.",
        Subtext = "Hand-rolled papad, stone-ground masala and small-batch sweets — sourced from home kitchens across Gujarat and shipped to your door.",
        HeroImageBase64 = string.Empty,
        HeroImageAltText = "Pramukhraj Foods traditional namkeen, farsan and papad products",
        HappyCustomersCount = string.Empty,
        HappyCustomersLabel = string.Empty,
        ProductCount = string.Empty,
        ProductCountLabel = string.Empty,
        AverageRating = string.Empty,
        AverageRatingLabel = string.Empty,
        ShowShopByCategory = true,
        ShowFeaturedProducts = true,
        ShowTrendingProducts = true,
        ShowBestSellerProducts = true,
        ShowNewArrivalProducts = true,
        ShowCustomerTestimonials = true,
        ShowFaqSection = true
    };

    private static CustomerHomepageHeroResponse CreateDefaultCustomerResponse()
    {
        var defaults = CreateDefaultAdminResponse();
        return new CustomerHomepageHeroResponse
        {
            EyebrowBadge = defaults.EyebrowBadge,
            Headline = defaults.Headline,
            Subtext = defaults.Subtext,
            HeroImageBase64 = string.Empty,
            HeroImageAltText = defaults.HeroImageAltText,
            HappyCustomersCount = null,
            HappyCustomersLabel = null,
            ProductCount = null,
            ProductCountLabel = null,
            AverageRating = null,
            AverageRatingLabel = null
        };
    }

    private static string? NullIfWhiteSpace(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private void InvalidateCustomerHomepageCaches()
    {
        const string invalidationReason = "Homepage CMS published";
        _cache.Remove(CacheKey.HomepageCms.CustomerHero, invalidationReason);
        _cache.Remove(CacheKey.Products.CustomerHome, invalidationReason);
        _cache.Remove(CacheKey.Categories.CustomerList, invalidationReason);
        _cache.Remove(CacheKey.Reviews.TopTestimonials, invalidationReason);
        _cache.Remove(CacheKey.Faqs.CustomerHome, invalidationReason);
    }

    private static ApiResponse<T> ValidationFailure<T>(ValidationResult validation) =>
        ApiResponse<T>.Fail(
            "Homepage CMS validation failed.",
            StatusCodes.Status400BadRequest,
            validation.Errors
                .GroupBy(error => error.PropertyName)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(error => error.ErrorMessage).Distinct().ToArray()));

    private static ApiResponse<T> DatabaseFailure<T>() =>
        ApiResponse<T>.Fail(
            "A database error occurred while processing homepage content. Please try again.",
            StatusCodes.Status500InternalServerError);

    private static ApiResponse<T> UnexpectedFailure<T>() =>
        ApiResponse<T>.Fail(
            "An unexpected error occurred while processing homepage content. Please try again later.",
            StatusCodes.Status500InternalServerError);
}
