using System.Data.Common;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.FAQ;
using pramukhraj.Entities;
using pramukhraj.Entities.FAQs;
using pramukhraj.Interfaces;
using static pramukhraj.Common.AdminActions;

namespace pramukhraj.Services;

public sealed class FaqService : IFaqService
{
    private const int PageSize = 10;
    private const int CustomerHomeLimit = 10;
    private static readonly TimeSpan CustomerCacheExpiration = TimeSpan.FromMinutes(30);

    private readonly AppDbContext _db;
    private readonly ILogger<FaqService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IValidatorManager _validatorManager;
    private readonly ICacheService _cache;

    public FaqService(
        AppDbContext db,
        ILogger<FaqService> logger,
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

    public async Task<ApiResponse<Guid>> CreateAsync(
        FaqWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return ApiResponse<Guid>.Fail("FAQ details are required.", StatusCodes.Status400BadRequest);

        var validation = await _validatorManager.FaqWriteRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<Guid>(validation);

        var admin = GetAdmin();
        if (!admin.Success)
            return ApiResponse<Guid>.Fail(admin.Message, admin.StatusCode, admin.Errors);

        var question = request.Question.Trim();
        var normalizedQuestion = NormalizeQuestion(question);

        try
        {
            var duplicateExists = await _db.Faqs
                .AsNoTracking()
                .AnyAsync(
                    faq => faq.Category == request.Category &&
                           faq.NormalizedQuestion == normalizedQuestion,
                    cancellationToken);

            if (duplicateExists)
                return ApiResponse<Guid>.Fail(
                    "An FAQ with the same question already exists in this category.",
                    StatusCodes.Status409Conflict);

            var now = DateTime.UtcNow;
            var faq = new FAQs
            {
                Id = Guid.NewGuid(),
                Category = request.Category,
                Question = question,
                NormalizedQuestion = normalizedQuestion,
                Answer = request.Answer.Trim(),
                DisplayOrder = request.DisplayOrder,
                IsFeatured = request.IsFeatured,
                IsActive = request.IsActive,
                CreatedOn = now,
                UpdatedOn = now
            };

            await _db.Faqs.AddAsync(faq, cancellationToken);
            await _db.AdminActions.AddAsync(
                BuildAudit(admin, faq, AdminActionTypes.Create, $"Created FAQ '{faq.Question}'.", now),
                cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            _cache.Remove(CacheKey.Faqs.CustomerHome);

            return new ApiResponse<Guid>
            {
                Success = true,
                StatusCode = StatusCodes.Status201Created,
                Message = "FAQ created successfully.",
                Data = faq.Id
            };
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            _logger.LogWarning(exception, "Duplicate FAQ rejected in category {Category}.", request.Category);
            return ApiResponse<Guid>.Fail(
                "An FAQ with the same question already exists in this category.",
                StatusCodes.Status409Conflict);
        }
        catch (DbUpdateException exception)
        {
            _logger.LogError(exception, "Database update error occurred while creating an FAQ.");
            return DatabaseFailure<Guid>();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error occurred while creating an FAQ.");
            return DatabaseFailure<Guid>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error occurred while creating an FAQ.");
            return UnexpectedFailure<Guid>();
        }
    }

    public async Task<ApiResponse<Guid>> UpdateAsync(
        Guid faqId,
        FaqWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        if (faqId == Guid.Empty)
            return ApiResponse<Guid>.Fail("A valid FAQ ID is required.", StatusCodes.Status400BadRequest);
        if (request is null)
            return ApiResponse<Guid>.Fail("FAQ details are required.", StatusCodes.Status400BadRequest);

        var validation = await _validatorManager.FaqWriteRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<Guid>(validation);

        var admin = GetAdmin();
        if (!admin.Success)
            return ApiResponse<Guid>.Fail(admin.Message, admin.StatusCode, admin.Errors);

        var question = request.Question.Trim();
        var answer = request.Answer.Trim();
        var normalizedQuestion = NormalizeQuestion(question);

        try
        {
            var faq = await _db.Faqs.SingleOrDefaultAsync(
                item => item.Id == faqId,
                cancellationToken);

            if (faq is null)
                return ApiResponse<Guid>.Fail("The requested FAQ was not found.", StatusCodes.Status404NotFound);

            var duplicateExists = await _db.Faqs
                .AsNoTracking()
                .AnyAsync(
                    item => item.Id != faqId &&
                            item.Category == request.Category &&
                            item.NormalizedQuestion == normalizedQuestion,
                    cancellationToken);

            if (duplicateExists)
                return ApiResponse<Guid>.Fail(
                    "An FAQ with the same question already exists in this category.",
                    StatusCodes.Status409Conflict);

            if (faq.Category == request.Category &&
                faq.Question == question &&
                faq.Answer == answer &&
                faq.DisplayOrder == request.DisplayOrder &&
                faq.IsFeatured == request.IsFeatured &&
                faq.IsActive == request.IsActive)
            {
                return ApiResponse<Guid>.Ok(faq.Id, "No FAQ changes were detected.");
            }

            faq.Category = request.Category;
            faq.Question = question;
            faq.NormalizedQuestion = normalizedQuestion;
            faq.Answer = answer;
            faq.DisplayOrder = request.DisplayOrder;
            faq.IsFeatured = request.IsFeatured;
            faq.IsActive = request.IsActive;
            faq.UpdatedOn = DateTime.UtcNow;

            await _db.AdminActions.AddAsync(
                BuildAudit(admin, faq, AdminActionTypes.Update, $"Updated FAQ '{faq.Question}'.", faq.UpdatedOn),
                cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            _cache.Remove(CacheKey.Faqs.CustomerHome);

            return ApiResponse<Guid>.Ok(faq.Id, "FAQ updated successfully.");
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            _logger.LogWarning(exception, "Duplicate FAQ update rejected for {FaqId}.", faqId);
            return ApiResponse<Guid>.Fail(
                "An FAQ with the same question already exists in this category.",
                StatusCodes.Status409Conflict);
        }
        catch (DbUpdateException exception)
        {
            _logger.LogError(exception, "Database update error occurred while updating FAQ {FaqId}.", faqId);
            return DatabaseFailure<Guid>();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error occurred while updating FAQ {FaqId}.", faqId);
            return DatabaseFailure<Guid>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error occurred while updating FAQ {FaqId}.", faqId);
            return UnexpectedFailure<Guid>();
        }
    }

    public async Task<ApiResponse<FaqDetailsResponse>> GetByIdAsync(
        Guid faqId,
        CancellationToken cancellationToken = default)
    {
        if (faqId == Guid.Empty)
            return ApiResponse<FaqDetailsResponse>.Fail("A valid FAQ ID is required.", StatusCodes.Status400BadRequest);

        try
        {
            var faq = await _db.Faqs
                .AsNoTracking()
                .Where(item => item.Id == faqId)
                .Select(item => new FaqDetailsResponse
                {
                    Id = item.Id,
                    Category = item.Category,
                    Question = item.Question,
                    Answer = item.Answer,
                    DisplayOrder = item.DisplayOrder,
                    IsFeatured = item.IsFeatured,
                    IsActive = item.IsActive,
                    CreatedOn = item.CreatedOn,
                    UpdatedOn = item.UpdatedOn
                })
                .SingleOrDefaultAsync(cancellationToken);

            return faq is null
                ? ApiResponse<FaqDetailsResponse>.Fail("The requested FAQ was not found.", StatusCodes.Status404NotFound)
                : ApiResponse<FaqDetailsResponse>.Ok(faq, "FAQ retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error occurred while retrieving FAQ {FaqId}.", faqId);
            return DatabaseFailure<FaqDetailsResponse>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error occurred while retrieving FAQ {FaqId}.", faqId);
            return UnexpectedFailure<FaqDetailsResponse>();
        }
    }

    public async Task<ApiResponse<FaqListPageResponse>> GetListAsync(
        int pageNumber,
        CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(pageNumber, 1);

        var recordsToSkip = ((long)pageNumber - 1) * PageSize;
        if (recordsToSkip > int.MaxValue)
            return ApiResponse<FaqListPageResponse>.Fail(
                "The requested page number exceeds the supported range.",
                StatusCodes.Status400BadRequest);

        try
        {
            
            var query = _db.Faqs.AsNoTracking();
            var totalCount = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(faq => faq.UpdatedOn)
                .ThenByDescending(faq => faq.Id)
                .Skip((int)recordsToSkip)
                .Take(PageSize)
                .Select(faq => new FaqListItemResponse
                {
                    Id = faq.Id,
                    Category = faq.Category,
                    Question = faq.Question,
                    AnswerPreview = faq.Answer.Length > 140
                        ? faq.Answer.Substring(0, 140) + "..."
                        : faq.Answer,
                    DisplayOrder = faq.DisplayOrder,
                    IsFeatured = faq.IsFeatured,
                    IsActive = faq.IsActive,
                    UpdatedOn = faq.UpdatedOn
                })
                .ToListAsync(cancellationToken);

            var page = new FaqListPageResponse
            {
                Items = items,
                PageNumber = pageNumber,
                PageSize = PageSize,
                TotalCount = totalCount,
                TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)PageSize)
            };

            return ApiResponse<FaqListPageResponse>.Ok(page, "FAQ list retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error occurred while retrieving the FAQ list.");
            return DatabaseFailure<FaqListPageResponse>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error occurred while retrieving the FAQ list.");
            return UnexpectedFailure<FaqListPageResponse>();
        }
    }

    public async Task<ApiResponse<List<CustomerFaqResponse>>> GetCustomerHomeFaqsAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            var HomePageCMS = await _db.HomepageCms.AsNoTracking().FirstOrDefaultAsync(h => h.Id == 1);
            if (HomePageCMS != null)
            {
                if (!HomePageCMS.ShowFaqSection)
                {
                    return ApiResponse<List<CustomerFaqResponse>>.Ok(new List<CustomerFaqResponse>(), "FAQ list retrieved successfully.");
                }
            }
            var faqs = await _cache.GetOrCreateAsync(
                CacheKey.Faqs.CustomerHome,
                token => _db.Faqs
                    .AsNoTracking()
                    .Where(faq => faq.IsActive && faq.IsFeatured)
                    .OrderBy(faq => faq.Category)
                    .ThenBy(faq => faq.DisplayOrder)
                    .ThenBy(faq => faq.Question)
                    .Take(CustomerHomeLimit)
                    .Select(faq => new CustomerFaqResponse
                    {
                        Id = faq.Id,
                        Question = faq.Question,
                        Answer = faq.Answer
                    })
                    .ToListAsync(token),
                CustomerCacheExpiration,
                size: CustomerHomeLimit,
                cancellationToken);

            return ApiResponse<List<CustomerFaqResponse>>.Ok(
                faqs,
                faqs.Count > 0 ? "FAQs retrieved successfully." : "No FAQs were found.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error occurred while retrieving customer FAQs.");
            return DatabaseFailure<List<CustomerFaqResponse>>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error occurred while retrieving customer FAQs.");
            return UnexpectedFailure<List<CustomerFaqResponse>>();
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

    private static AdminAction BuildAudit(
        (bool Success, Guid Id, string Name, int StatusCode, string Message, object? Errors) admin,
        FAQs faq,
        string action,
        string description,
        DateTime now) => new()
    {
        Id = Guid.NewGuid(),
        AdminId = admin.Id,
        AdminName = admin.Name,
        Module = AdminActionModules.Faq,
        Action = action,
        EntityId = faq.Id,
        EntityName = faq.Question.Length > 250 ? faq.Question[..250] : faq.Question,
        Description = description.Length > 1000 ? description[..1000] : description,
        CreatedOn = now
    };

    private static string NormalizeQuestion(string question) =>
        string.Join(' ', question
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .ToUpperInvariant();

    private static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };

    private static ApiResponse<T> ValidationFailure<T>(ValidationResult validation) =>
        ApiResponse<T>.Fail(
            "FAQ validation failed.",
            StatusCodes.Status400BadRequest,
            validation.Errors
                .GroupBy(error => error.PropertyName)
                .ToDictionary(
                    group => group.Key,
                    group => group.Select(error => error.ErrorMessage).Distinct().ToArray()));

    private static ApiResponse<T> DatabaseFailure<T>() =>
        ApiResponse<T>.Fail(
            "A database error occurred while processing the FAQ. Please try again.",
            StatusCodes.Status500InternalServerError);

    private static ApiResponse<T> UnexpectedFailure<T>() =>
        ApiResponse<T>.Fail(
            "An unexpected error occurred while processing the FAQ. Please try again later.",
            StatusCodes.Status500InternalServerError);
}
