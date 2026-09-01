using System.Data.Common;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Coupon;
using pramukhraj.Entities;
using pramukhraj.Entities.Coupon;
using pramukhraj.Interfaces;
using static pramukhraj.Common.AdminActions;
using static pramukhraj.Entities.Coupon.CouponEnums;

namespace pramukhraj.Services;

public sealed class CouponService : ICouponService
{
    private const int CouponPageSize = 20;
    private readonly AppDbContext _db;
    private readonly ILogger<CouponService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IValidatorManager _validatorManager;

    public CouponService(
        AppDbContext db,
        ILogger<CouponService> logger,
        IHttpContextAccessor httpContextAccessor,
        IValidatorManager validatorManager)
    {
        _db = db;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
        _validatorManager = validatorManager;
    }

    public async Task<ApiResponse<Guid>> CreateCouponAsync(
        CreateCouponRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
        {
            return ApiResponse<Guid>.Fail("Coupon details are required.", StatusCodes.Status400BadRequest);
        }

        var validation = await _validatorManager.CreateCouponRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<Guid>(validation);

        var admin = GetAdmin();
        if (!admin.Success) return ApiResponse<Guid>.Fail(admin.Message, admin.StatusCode, admin.Errors);

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        var now = DateTime.UtcNow;

        try
        {
            if (await _db.Coupons.AsNoTracking().AnyAsync(coupon => coupon.Code == normalizedCode, cancellationToken))
            {
                return ApiResponse<Guid>.Fail("A coupon with the same code already exists.", StatusCodes.Status409Conflict);
            }

            var invalidScope = await ValidateScopeTargetsAsync(request, cancellationToken);
            if (invalidScope is not null) return ApiResponse<Guid>.Fail(invalidScope, StatusCodes.Status400BadRequest);

            var couponId = Guid.NewGuid();
            var coupon = new Coupon
            {
                Id = couponId,
                Code = normalizedCode,
                Name = request.Name.Trim(),
                Description = request.Description?.Trim() ?? string.Empty,
                DiscountType = request.DiscountType,
                DiscountValue = request.DiscountValue,
                MinimumOrderAmount = request.MinimumOrderAmount,
                MaximumDiscountAmount = request.MaximumDiscountAmount,
                ApplicationScope = request.ApplicationScope,
                TotalUsageLimit = request.TotalUsageLimit,
                PerCustomerUsageLimit = request.PerCustomerUsageLimit,
                IsFirstOrderOnly = request.IsFirstOrderOnly,
                CanCombineWithOtherDiscounts = request.CanCombineWithOtherDiscounts,
                StartOn = ToUtc(request.StartOn),
                EndOn = ToUtc(request.EndOn),
                IsActive = request.IsActive,
                IsDeleted = false,
                CreatedByAdminId = admin.Id,
                UpdatedByAdminId = admin.Id,
                CreatedOn = now,
                UpdatedOn = now,
                Version = Guid.NewGuid()
            };

            coupon.Scopes = BuildScopes(couponId, request, now);

            var audit = BuildAudit(admin, coupon, AdminActionTypes.Create, $"Created coupon '{coupon.Code}'.", now);
            await _db.Coupons.AddAsync(coupon, cancellationToken);
            await _db.AdminActions.AddAsync(audit, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            return new ApiResponse<Guid>
            {
                Success = true,
                StatusCode = StatusCodes.Status201Created,
                Message = "Coupon created successfully.",
                Data = couponId
            };
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            _logger.LogWarning(exception, "Unique constraint rejected coupon creation for code {CouponCode}.", normalizedCode);
            return ApiResponse<Guid>.Fail("A coupon with the same code already exists.", StatusCodes.Status409Conflict);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("Coupon creation was cancelled for code {CouponCode}.", normalizedCode);
            return Cancelled<Guid>();
        }
        catch (DbUpdateException exception)
        {
            _logger.LogError(exception, "Database error while creating coupon {CouponCode}.", normalizedCode);
            return DatabaseFailure<Guid>();
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error while creating coupon {CouponCode}.", normalizedCode);
            return DatabaseFailure<Guid>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error while creating coupon {CouponCode}.", normalizedCode);
            return UnexpectedFailure<Guid>();
        }
    }

    public async Task<ApiResponse<Guid>> UpdateCouponAsync(
        Guid couponId,
        UpdateCouponRequest request,
        CancellationToken cancellationToken = default)
    {
        if (couponId == Guid.Empty) return ApiResponse<Guid>.Fail("A valid coupon ID is required.", StatusCodes.Status400BadRequest);
        if (request is null) return ApiResponse<Guid>.Fail("Coupon details are required.", StatusCodes.Status400BadRequest);

        var validation = await _validatorManager.UpdateCouponRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<Guid>(validation);

        var admin = GetAdmin();
        if (!admin.Success) return ApiResponse<Guid>.Fail(admin.Message, admin.StatusCode, admin.Errors);

        var normalizedCode = request.Code.Trim().ToUpperInvariant();

        try
        {
            var coupon = await _db.Coupons
                .Include(item => item.Scopes)
                .SingleOrDefaultAsync(item => item.Id == couponId && !item.IsDeleted, cancellationToken);

            if (coupon is null)
            {
                return ApiResponse<Guid>.Fail("The requested coupon was not found.", StatusCodes.Status404NotFound);
            }

            if (await _db.Coupons.AsNoTracking().AnyAsync(
                item => item.Id != couponId && item.Code == normalizedCode,
                cancellationToken))
            {
                return ApiResponse<Guid>.Fail("A coupon with the same code already exists.", StatusCodes.Status409Conflict);
            }

            var invalidScope = await ValidateScopeTargetsAsync(request, cancellationToken);
            if (invalidScope is not null) return ApiResponse<Guid>.Fail(invalidScope, StatusCodes.Status400BadRequest);

            var redeemedCount = await _db.CouponUsages.AsNoTracking().CountAsync(
                usage => usage.CouponId == couponId && usage.Status == CouponUsageStatus.Redeemed,
                cancellationToken);

            if (redeemedCount > 0 && HasProtectedHistoricalChanges(coupon, request, normalizedCode))
            {
                return ApiResponse<Guid>.Fail(
                    "Redeemed coupons can only have their active status or end date changed.",
                    StatusCodes.Status409Conflict);
            }

            var requestedScopeIds = GetRequestedScopeIds(request);
            var currentScopeIds = coupon.Scopes
                .Select(scope => scope.ProductId ?? scope.CategoryId ?? Guid.Empty)
                .Where(id => id != Guid.Empty)
                .ToHashSet();

            var scopesChanged = coupon.ApplicationScope != request.ApplicationScope ||
                !currentScopeIds.SetEquals(requestedScopeIds);
            var fieldsChanged = HasEditableChanges(coupon, request, normalizedCode);

            if (!fieldsChanged && !scopesChanged)
            {
                return new ApiResponse<Guid>
                {
                    Success = true,
                    StatusCode = StatusCodes.Status200OK,
                    Message = "No coupon changes were detected.",
                    Data = couponId
                };
            }

            var wasActive = coupon.IsActive;
            coupon.Code = normalizedCode;
            coupon.Name = request.Name.Trim();
            coupon.Description = request.Description?.Trim() ?? string.Empty;
            coupon.DiscountType = request.DiscountType;
            coupon.DiscountValue = request.DiscountValue;
            coupon.MinimumOrderAmount = request.MinimumOrderAmount;
            coupon.MaximumDiscountAmount = request.MaximumDiscountAmount;
            coupon.ApplicationScope = request.ApplicationScope;
            coupon.TotalUsageLimit = request.TotalUsageLimit;
            coupon.PerCustomerUsageLimit = request.PerCustomerUsageLimit;
            coupon.IsFirstOrderOnly = request.IsFirstOrderOnly;
            coupon.CanCombineWithOtherDiscounts = request.CanCombineWithOtherDiscounts;
            coupon.StartOn = ToUtc(request.StartOn);
            coupon.EndOn = ToUtc(request.EndOn);
            coupon.IsActive = request.IsActive;
            coupon.UpdatedByAdminId = admin.Id;
            coupon.UpdatedOn = DateTime.UtcNow;
            coupon.Version = Guid.NewGuid();

            if (scopesChanged)
            {
                _db.CouponScopes.RemoveRange(coupon.Scopes);
                coupon.Scopes = BuildScopes(couponId, request, coupon.UpdatedOn);
            }

            var actionType = request.IsActive == wasActive
                ? AdminActionTypes.Update
                : request.IsActive ? AdminActionTypes.Activate : AdminActionTypes.Deactivate;
            await _db.AdminActions.AddAsync(
                BuildAudit(admin, coupon, actionType, $"Updated coupon '{coupon.Code}'.", coupon.UpdatedOn),
                cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            return new ApiResponse<Guid>
            {
                Success = true,
                StatusCode = StatusCodes.Status200OK,
                Message = "Coupon updated successfully.",
                Data = couponId
            };
        }
        catch (DbUpdateConcurrencyException exception)
        {
            _logger.LogWarning(exception, "Concurrency conflict updating coupon {CouponId}.", couponId);
            return ApiResponse<Guid>.Fail("The coupon was modified by another request. Refresh and try again.", StatusCodes.Status409Conflict);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            _logger.LogWarning(exception, "Unique constraint rejected coupon update {CouponId}.", couponId);
            return ApiResponse<Guid>.Fail("A coupon with the same code already exists.", StatusCodes.Status409Conflict);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return Cancelled<Guid>();
        }
        catch (DbUpdateException exception)
        {
            _logger.LogError(exception, "Database error updating coupon {CouponId}.", couponId);
            return DatabaseFailure<Guid>();
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error updating coupon {CouponId}.", couponId);
            return DatabaseFailure<Guid>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error updating coupon {CouponId}.", couponId);
            return UnexpectedFailure<Guid>();
        }
    }

    public async Task<ApiResponse<CouponDetailsResponse>> GetCouponByIdAsync(
        Guid couponId,
        CancellationToken cancellationToken = default)
    {
        if (couponId == Guid.Empty)
            return ApiResponse<CouponDetailsResponse>.Fail("A valid coupon ID is required.", StatusCodes.Status400BadRequest);

        try
        {
            var coupon = await _db.Coupons.AsNoTracking()
                .Where(item => item.Id == couponId && !item.IsDeleted)
                .Select(item => new CouponDetailsResponse
                {
                    Id = item.Id,
                    Code = item.Code,
                    Name = item.Name,
                    Description = item.Description,
                    DiscountType = item.DiscountType,
                    DiscountValue = item.DiscountValue,
                    MinimumOrderAmount = item.MinimumOrderAmount,
                    MaximumDiscountAmount = item.MaximumDiscountAmount,
                    ApplicationScope = item.ApplicationScope,
                    ProductIds = item.Scopes.Where(scope => scope.ProductId.HasValue).Select(scope => scope.ProductId!.Value).ToList(),
                    CategoryIds = item.Scopes.Where(scope => scope.CategoryId.HasValue).Select(scope => scope.CategoryId!.Value).ToList(),
                    TotalUsageLimit = item.TotalUsageLimit,
                    PerCustomerUsageLimit = item.PerCustomerUsageLimit,
                    IsFirstOrderOnly = item.IsFirstOrderOnly,
                    CanCombineWithOtherDiscounts = item.CanCombineWithOtherDiscounts,
                    StartOn = item.StartOn,
                    EndOn = item.EndOn,
                    IsActive = item.IsActive,
                    CreatedOn = item.CreatedOn,
                    UpdatedOn = item.UpdatedOn,
                    RedeemedUsageCount = item.Usages.Count(usage => usage.Status == CouponUsageStatus.Redeemed),
                    ReservedUsageCount = item.Usages.Count(usage => usage.Status == CouponUsageStatus.Reserved)
                })
                .SingleOrDefaultAsync(cancellationToken);

            return coupon is null
                ? ApiResponse<CouponDetailsResponse>.Fail("The requested coupon was not found.", StatusCodes.Status404NotFound)
                : ApiResponse<CouponDetailsResponse>.Ok(coupon, "Coupon retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return Cancelled<CouponDetailsResponse>();
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error retrieving coupon {CouponId}.", couponId);
            return DatabaseFailure<CouponDetailsResponse>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error retrieving coupon {CouponId}.", couponId);
            return UnexpectedFailure<CouponDetailsResponse>();
        }
    }

    public async Task<ApiResponse<CouponListPageResponse>> GetCouponListAsync(
        int pageNumber,
        CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(pageNumber, 1);

        try
        {
            var now = DateTime.UtcNow;
            IQueryable<Coupon> query = _db.Coupons.AsNoTracking();

            var totalCount = await query.CountAsync(cancellationToken);
            query = query.OrderByDescending(coupon => coupon.UpdatedOn).ThenByDescending(coupon => coupon.Id);

            var items = await query
                .Skip((pageNumber - 1) * CouponPageSize)
                .Take(CouponPageSize)
                .Select(coupon => new CouponListItemResponse
                {
                    Id = coupon.Id,
                    Code = coupon.Code,
                    Name = coupon.Name,
                    DiscountType = coupon.DiscountType,
                    DiscountValue = coupon.DiscountValue,
                    ApplicationScope = coupon.ApplicationScope,
                    MinimumOrderAmount = coupon.MinimumOrderAmount,
                    MaximumDiscountAmount = coupon.MaximumDiscountAmount,
                    TotalUsageLimit = coupon.TotalUsageLimit,
                    PerCustomerUsageLimit = coupon.PerCustomerUsageLimit,
                    RedeemedUsageCount = coupon.Usages.Count(usage => usage.Status == CouponUsageStatus.Redeemed),
                    StartOn = coupon.StartOn.AddMinutes(-Common.Common.GetTimeZone(_httpContextAccessor)).ToString("yyyy-MM-dd"),
                    EndOn = coupon.EndOn.AddMinutes(-Common.Common.GetTimeZone(_httpContextAccessor)).ToString("yyyy-MM-dd"),
                    IsActive = coupon.IsActive,
                    IsDeleted = coupon.IsDeleted,
                    ScopeItemCount = coupon.Scopes.Count,
                    ComputedStatus = coupon.IsDeleted
                        ? CouponDisplayStatus.Archived
                        : coupon.TotalUsageLimit.HasValue && coupon.Usages.Count(usage => usage.Status == CouponUsageStatus.Redeemed) >= coupon.TotalUsageLimit.Value
                            ? CouponDisplayStatus.UsageLimitReached
                            : !coupon.IsActive ? CouponDisplayStatus.Inactive
                            : coupon.StartOn > now ? CouponDisplayStatus.Scheduled
                            : coupon.EndOn <= now ? CouponDisplayStatus.Expired
                            : CouponDisplayStatus.Active
                })
                .ToListAsync(cancellationToken);

            foreach (var item in items)
            {
                item.DisplayFriendlyDiscount = item.DiscountType switch
                {
                    CouponDiscountType.Percentage => $"{item.DiscountValue:0.##}% off",
                    CouponDiscountType.FlatAmount => $"₹{item.DiscountValue:0.##} off",
                    _ => "Free shipping"
                };
            }

            var page = new CouponListPageResponse
            {
                Items = items,
                PageNumber = pageNumber,
                PageSize = CouponPageSize,
                TotalCount = totalCount,
                TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)CouponPageSize)
            };
            return ApiResponse<CouponListPageResponse>.Ok(page, "Coupon list retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return Cancelled<CouponListPageResponse>();
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error retrieving coupon list.");
            return DatabaseFailure<CouponListPageResponse>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error retrieving coupon list.");
            return UnexpectedFailure<CouponListPageResponse>();
        }
    }

    public async Task<ApiResponse<string>> ArchiveCouponAsync(Guid couponId, CancellationToken cancellationToken = default)
    {
        if (couponId == Guid.Empty) return ApiResponse<string>.Fail("A valid coupon ID is required.", StatusCodes.Status400BadRequest);
        var admin = GetAdmin();
        if (!admin.Success) return ApiResponse<string>.Fail(admin.Message, admin.StatusCode, admin.Errors);

        try
        {
            var coupon = await _db.Coupons.SingleOrDefaultAsync(item => item.Id == couponId && !item.IsDeleted, cancellationToken);
            if (coupon is null) return ApiResponse<string>.Fail("The requested coupon was not found.", StatusCodes.Status404NotFound);

            var now = DateTime.UtcNow;
            coupon.IsDeleted = true;
            coupon.IsActive = false;
            coupon.DeletedOn = now;
            coupon.UpdatedOn = now;
            coupon.UpdatedByAdminId = admin.Id;
            coupon.Version = Guid.NewGuid();
            await _db.AdminActions.AddAsync(
                BuildAudit(admin, coupon, AdminActionTypes.Delete, $"Archived coupon '{coupon.Code}'.", now),
                cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            return ApiResponse<string>.Ok(couponId.ToString(), "Coupon archived successfully.");
        }
        catch (DbUpdateConcurrencyException exception)
        {
            _logger.LogWarning(exception, "Concurrency conflict archiving coupon {CouponId}.", couponId);
            return ApiResponse<string>.Fail("The coupon was modified by another request. Refresh and try again.", StatusCodes.Status409Conflict);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return Cancelled<string>();
        }
        catch (DbUpdateException exception)
        {
            _logger.LogError(exception, "Database error archiving coupon {CouponId}.", couponId);
            return DatabaseFailure<string>();
        }
        catch (DbException exception)
        {
            _logger.LogError(exception, "Database error archiving coupon {CouponId}.", couponId);
            return DatabaseFailure<string>();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error archiving coupon {CouponId}.", couponId);
            return UnexpectedFailure<string>();
        }
    }

    private async Task<string?> ValidateScopeTargetsAsync(CouponWriteRequest request, CancellationToken cancellationToken)
    {
        if (request.ApplicationScope == CouponApplicationScope.SpecificProducts)
        {
            var validIds = await _db.Products.AsNoTracking()
                .Where(product => request.ProductIds.Contains(product.Id))
                .Select(product => product.Id)
                .ToListAsync(cancellationToken);
            if (validIds.Count != request.ProductIds.Count) return "One or more selected products are invalid.";
        }
        else if (request.ApplicationScope == CouponApplicationScope.SpecificCategories)
        {
            var validIds = await _db.ProductCategories.AsNoTracking()
                .Where(category => request.CategoryIds.Contains(category.Id))
                .Select(category => category.Id)
                .ToListAsync(cancellationToken);
            if (validIds.Count != request.CategoryIds.Count) return "One or more selected categories are invalid.";
        }
        return null;
    }

    private static List<CouponScope> BuildScopes(Guid couponId, CouponWriteRequest request, DateTime now)
    {
        if (request.ApplicationScope == CouponApplicationScope.SpecificProducts)
        {
            return request.ProductIds.Select(productId => new CouponScope
            {
                Id = Guid.NewGuid(), CouponId = couponId, ScopeType = CouponScopeType.Product, ProductId = productId, CreatedOn = now
            }).ToList();
        }
        if (request.ApplicationScope == CouponApplicationScope.SpecificCategories)
        {
            return request.CategoryIds.Select(categoryId => new CouponScope
            {
                Id = Guid.NewGuid(), CouponId = couponId, ScopeType = CouponScopeType.Category, CategoryId = categoryId, CreatedOn = now
            }).ToList();
        }
        return [];
    }

    private static HashSet<Guid> GetRequestedScopeIds(CouponWriteRequest request) => request.ApplicationScope switch
    {
        CouponApplicationScope.SpecificProducts => request.ProductIds.ToHashSet(),
        CouponApplicationScope.SpecificCategories => request.CategoryIds.ToHashSet(),
        _ => []
    };

    private static bool HasEditableChanges(Coupon coupon, CouponWriteRequest request, string normalizedCode) =>
        coupon.Code != normalizedCode || coupon.Name != request.Name.Trim() || coupon.Description != (request.Description?.Trim() ?? string.Empty) ||
        coupon.DiscountType != request.DiscountType || coupon.DiscountValue != request.DiscountValue ||
        coupon.MinimumOrderAmount != request.MinimumOrderAmount || coupon.MaximumDiscountAmount != request.MaximumDiscountAmount ||
        coupon.ApplicationScope != request.ApplicationScope || coupon.TotalUsageLimit != request.TotalUsageLimit ||
        coupon.PerCustomerUsageLimit != request.PerCustomerUsageLimit || coupon.IsFirstOrderOnly != request.IsFirstOrderOnly ||
        coupon.CanCombineWithOtherDiscounts != request.CanCombineWithOtherDiscounts || coupon.StartOn != ToUtc(request.StartOn) ||
        coupon.EndOn != ToUtc(request.EndOn) || coupon.IsActive != request.IsActive;

    private static bool HasProtectedHistoricalChanges(Coupon coupon, CouponWriteRequest request, string normalizedCode) =>
        coupon.Code != normalizedCode || coupon.Name != request.Name.Trim() || coupon.Description != (request.Description?.Trim() ?? string.Empty) ||
        coupon.DiscountType != request.DiscountType || coupon.DiscountValue != request.DiscountValue ||
        coupon.MinimumOrderAmount != request.MinimumOrderAmount || coupon.MaximumDiscountAmount != request.MaximumDiscountAmount ||
        coupon.ApplicationScope != request.ApplicationScope || coupon.TotalUsageLimit != request.TotalUsageLimit ||
        coupon.PerCustomerUsageLimit != request.PerCustomerUsageLimit || coupon.IsFirstOrderOnly != request.IsFirstOrderOnly ||
        coupon.CanCombineWithOtherDiscounts != request.CanCombineWithOtherDiscounts || coupon.StartOn != ToUtc(request.StartOn) ||
        !coupon.Scopes.Select(scope => scope.ProductId ?? scope.CategoryId ?? Guid.Empty).Where(id => id != Guid.Empty).ToHashSet()
            .SetEquals(GetRequestedScopeIds(request));

    private (bool Success, Guid Id, string Name, int StatusCode, string Message, object? Errors) GetAdmin()
    {
        var result = Common.Common.GetAdminClaimInfo(_httpContextAccessor);
        if (!result.Success || result.Data is null || !Guid.TryParse(result.Data.Id, out var id) || id == Guid.Empty)
        {
            return (false, Guid.Empty, string.Empty, result.StatusCode == 0 ? StatusCodes.Status401Unauthorized : result.StatusCode,
                result.Message ?? "Authenticated administrator information was not found.", result.Errors);
        }
        return (true, id, result.Data.UserName?.Trim() ?? "Unknown Admin", StatusCodes.Status200OK, string.Empty, null);
    }

    private static AdminAction BuildAudit(
        (bool Success, Guid Id, string Name, int StatusCode, string Message, object? Errors) admin,
        Coupon coupon,
        string action,
        string description,
        DateTime now) => new()
    {
            Id = Guid.NewGuid(), 
            AdminId = admin.Id,
            AdminName = admin.Name,
            Module = AdminActionModules.Coupon,
            Action = action,
            EntityId = coupon.Id,
            EntityName = $"{coupon.Code} - {coupon.Name}",
            Description = description,
            CreatedOn = now
    };

    private static DateTime ToUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
    };

    private static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation };

    private static ApiResponse<T> ValidationFailure<T>(ValidationResult validation) => ApiResponse<T>.Fail(
        "Coupon validation failed.",
        StatusCodes.Status400BadRequest,
        validation.Errors.GroupBy(error => error.PropertyName)
            .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).Distinct().ToArray()));

    private static ApiResponse<T> Cancelled<T>() => ApiResponse<T>.Fail(
        "The coupon request was cancelled before it could be completed.", StatusCodes.Status408RequestTimeout);

    private static ApiResponse<T> DatabaseFailure<T>() => ApiResponse<T>.Fail(
        "A database error occurred while processing the coupon. Please try again.", StatusCodes.Status500InternalServerError);

    private static ApiResponse<T> UnexpectedFailure<T>() => ApiResponse<T>.Fail(
        "An unexpected error occurred while processing the coupon. Please try again later.", StatusCodes.Status500InternalServerError);
}
