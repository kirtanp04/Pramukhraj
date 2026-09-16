using System.Data.Common;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Customer;
using pramukhraj.Entities;
using pramukhraj.Entities.Cart;
using pramukhraj.Interfaces;
using static pramukhraj.Common.AdminActions;

namespace pramukhraj.Services;

public sealed class AdminCustomerService(
    AppDbContext db,
    ILogger<AdminCustomerService> logger,
    IHttpContextAccessor httpContextAccessor,
    IValidatorManager validatorManager) : IAdminCustomerService
{
    public async Task<ApiResponse<AdminCustomerListPageResponse>> GetListAsync(
        AdminCustomerListRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return ApiResponse<AdminCustomerListPageResponse>.Fail("Customer list options are required.", StatusCodes.Status400BadRequest);

        var validation = await validatorManager.AdminCustomerListRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<AdminCustomerListPageResponse>(validation);

        try
        {
            var normalizedStatus = request.Status.Trim().ToUpperInvariant();
            var query = db.Customers.AsNoTracking().AsQueryable();
            query = normalizedStatus switch
            {
                AdminCustomerStatuses.Active => query.Where(x => !x.IsDeleted && x.IsActive && !x.IsBlocked),
                AdminCustomerStatuses.Inactive => query.Where(x => !x.IsDeleted && !x.IsActive && !x.IsBlocked),
                AdminCustomerStatuses.Blocked => query.Where(x => !x.IsDeleted && x.IsBlocked),
                AdminCustomerStatuses.Deleted => query.Where(x => x.IsDeleted),
                _ => query
            };

            var search = request.Search?.Trim();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var normalizedSearch = search.ToUpperInvariant();
                query = query.Where(x =>
                    x.FullName.ToUpper().Contains(normalizedSearch)
                    || x.MobileNumber.Contains(search)
                    || (x.NormalizedEmail != null && x.NormalizedEmail.Contains(normalizedSearch)));
            }

            var totalCount = await query.CountAsync(cancellationToken);
            var descending = request.SortDirection.Equals("desc", StringComparison.OrdinalIgnoreCase);
            query = request.SortBy.Trim().ToLowerInvariant() switch
            {
                "fullname" => descending ? query.OrderByDescending(x => x.FullName).ThenByDescending(x => x.Id) : query.OrderBy(x => x.FullName).ThenBy(x => x.Id),
                "updatedon" => descending ? query.OrderByDescending(x => x.UpdatedOn).ThenByDescending(x => x.Id) : query.OrderBy(x => x.UpdatedOn).ThenBy(x => x.Id),
                "lastloginon" => descending ? query.OrderByDescending(x => x.LastLoginOn).ThenByDescending(x => x.Id) : query.OrderBy(x => x.LastLoginOn).ThenBy(x => x.Id),
                _ => descending ? query.OrderByDescending(x => x.CreatedOn).ThenByDescending(x => x.Id) : query.OrderBy(x => x.CreatedOn).ThenBy(x => x.Id)
            };

            var items = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(x => new AdminCustomerListItemResponse(
                    x.Id,
                    x.FullName,
                    x.MobileNumber,
                    x.Email,
                    x.City,
                    x.State,
                    x.IsDeleted ? AdminCustomerStatuses.Deleted
                        : x.IsBlocked ? AdminCustomerStatuses.Blocked
                        : x.IsActive ? AdminCustomerStatuses.Active
                        : AdminCustomerStatuses.Inactive,
                    x.IsMobileVerified,
                    x.IsEmailVerified,
                    x.IsProfileCompleted,
                    x.MarketingConsent,
                    x.Addresses.Count(address => address.IsActive),
                    db.Reviews.Count(review => review.CustomerId == x.Id),
                    x.LastLoginOn,
                    x.CreatedOn,
                    x.UpdatedOn,
                    x.ConcurrencyStamp))
                .ToListAsync(cancellationToken);

            var summary = await db.Customers.AsNoTracking()
                .GroupBy(_ => 1)
                .Select(group => new AdminCustomerSummaryResponse(
                    group.Count(),
                    group.Count(x => !x.IsDeleted && x.IsActive && !x.IsBlocked),
                    group.Count(x => !x.IsDeleted && x.IsBlocked),
                    group.Count(x => !x.IsDeleted && !x.IsActive && !x.IsBlocked),
                    group.Count(x => x.IsDeleted)))
                .SingleOrDefaultAsync(cancellationToken)
                ?? new AdminCustomerSummaryResponse(0, 0, 0, 0, 0);

            var response = new AdminCustomerListPageResponse(
                items,
                request.PageNumber,
                request.PageSize,
                totalCount,
                Math.Max(1, (int)Math.Ceiling(totalCount / (double)request.PageSize)),
                summary);
            return ApiResponse<AdminCustomerListPageResponse>.Ok(response, "Customers retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return Cancelled<AdminCustomerListPageResponse>();
        }
        catch (Exception exception) when (exception is DbException or InvalidOperationException)
        {
            logger.LogError(exception, "Database error retrieving the admin customer list.");
            return DatabaseFailure<AdminCustomerListPageResponse>();
        }
    }

    public async Task<ApiResponse<AdminCustomerDetailsResponse>> GetByIdAsync(
        Guid customerId,
        CancellationToken cancellationToken = default)
    {
        if (customerId == Guid.Empty)
            return ApiResponse<AdminCustomerDetailsResponse>.Fail("A valid customer ID is required.", StatusCodes.Status400BadRequest);

        try
        {
            var details = await BuildDetailsAsync(customerId, cancellationToken);
            return details is null
                ? ApiResponse<AdminCustomerDetailsResponse>.Fail("The requested customer was not found.", StatusCodes.Status404NotFound)
                : ApiResponse<AdminCustomerDetailsResponse>.Ok(details, "Customer details retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return Cancelled<AdminCustomerDetailsResponse>();
        }
        catch (Exception exception) when (exception is DbException or InvalidOperationException)
        {
            logger.LogError(exception, "Database error retrieving customer {CustomerId}.", customerId);
            return DatabaseFailure<AdminCustomerDetailsResponse>();
        }
    }

    public async Task<ApiResponse<AdminCustomerDetailsResponse>> PatchAsync(
        Guid customerId,
        PatchAdminCustomerRequest request,
        CancellationToken cancellationToken = default)
    {
        if (customerId == Guid.Empty)
            return ApiResponse<AdminCustomerDetailsResponse>.Fail("A valid customer ID is required.", StatusCodes.Status400BadRequest);
        if (request is null)
            return ApiResponse<AdminCustomerDetailsResponse>.Fail("Customer changes are required.", StatusCodes.Status400BadRequest);

        var validation = await validatorManager.PatchAdminCustomerRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<AdminCustomerDetailsResponse>(validation);

        var adminResult = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        if (!adminResult.Success || adminResult.Data is null || !Guid.TryParse(adminResult.Data.Id, out var adminId))
            return ApiResponse<AdminCustomerDetailsResponse>.Fail("Authenticated administrator information was not found.", StatusCodes.Status401Unauthorized);

        try
        {
            var customer = await db.Customers.SingleOrDefaultAsync(x => x.Id == customerId, cancellationToken);
            if (customer is null)
                return ApiResponse<AdminCustomerDetailsResponse>.Fail("The requested customer was not found.", StatusCodes.Status404NotFound);
            if (customer.IsDeleted)
                return ApiResponse<AdminCustomerDetailsResponse>.Fail("Deleted customer accounts cannot be modified.", StatusCodes.Status409Conflict);
            if (!string.Equals(customer.ConcurrencyStamp, request.ConcurrencyStamp, StringComparison.Ordinal))
                return ApiResponse<AdminCustomerDetailsResponse>.Fail("This customer was modified by another request. Refresh and try again.", StatusCodes.Status409Conflict);

            var normalizedEmail = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToUpperInvariant();
            if (normalizedEmail is not null && await db.Customers.AsNoTracking().AnyAsync(
                    x => x.Id != customerId && x.NormalizedEmail == normalizedEmail,
                    cancellationToken))
                return ApiResponse<AdminCustomerDetailsResponse>.Fail("Another customer already uses this email address.", StatusCodes.Status409Conflict);

            var now = DateTime.UtcNow;
            var status = request.Status.Trim().ToUpperInvariant();
            var wasSignInAllowed = customer.IsActive && !customer.IsBlocked && !customer.IsDeleted;
            var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLowerInvariant();
            var emailChanged = !string.Equals(customer.NormalizedEmail, normalizedEmail, StringComparison.Ordinal);

            customer.FullName = request.FullName.Trim();
            customer.Email = email;
            customer.NormalizedEmail = normalizedEmail;
            if (emailChanged) customer.IsEmailVerified = false;
            customer.City = NullIfWhiteSpace(request.City);
            customer.State = NullIfWhiteSpace(request.State);
            customer.PostalCode = NullIfWhiteSpace(request.PostalCode);
            if (customer.MarketingConsent != request.MarketingConsent)
                customer.MarketingConsentOn = request.MarketingConsent ? now : null;
            customer.MarketingConsent = request.MarketingConsent;
            customer.IsBlocked = status == AdminCustomerStatuses.Blocked;
            customer.IsActive = status != AdminCustomerStatuses.Inactive;
            customer.BlockReason = customer.IsBlocked ? request.BlockReason!.Trim() : null;
            customer.BlockedOn = customer.IsBlocked ? customer.BlockedOn ?? now : null;
            customer.IsProfileCompleted = !string.IsNullOrWhiteSpace(customer.FullName) && !string.IsNullOrWhiteSpace(customer.Email);
            customer.UpdatedOn = now;
            customer.ConcurrencyStamp = Guid.NewGuid().ToString("N");

            var isSignInAllowed = customer.IsActive && !customer.IsBlocked;
            if (wasSignInAllowed != isSignInAllowed)
            {
                customer.TokenVersion++;
                var sessions = await db.CustomerRefreshTokens
                    .Where(x => x.CustomerId == customerId && x.RevokedOn == null)
                    .ToListAsync(cancellationToken);
                foreach (var session in sessions) session.RevokedOn = now;
            }

            db.AdminActions.Add(new AdminAction
            {
                Id = Guid.NewGuid(),
                AdminId = adminId,
                AdminName = adminResult.Data.UserName?.Trim() ?? "Unknown Admin",
                Module = AdminActionModules.Customer,
                Action = status == AdminCustomerStatuses.Blocked ? AdminActionTypes.Deactivate
                    : status == AdminCustomerStatuses.Active && !wasSignInAllowed ? AdminActionTypes.Activate
                    : AdminActionTypes.Update,
                EntityId = customer.Id,
                EntityName = customer.FullName,
                Description = $"Updated customer '{customer.FullName}' with account status {status}.",
                CreatedOn = now
            });

            await db.SaveChangesAsync(cancellationToken);
            var details = await BuildDetailsAsync(customerId, cancellationToken);
            return ApiResponse<AdminCustomerDetailsResponse>.Ok(details, "Customer updated successfully.");
        }
        catch (DbUpdateConcurrencyException exception)
        {
            logger.LogWarning(exception, "Concurrency conflict updating customer {CustomerId}.", customerId);
            return ApiResponse<AdminCustomerDetailsResponse>.Fail("This customer was modified by another request. Refresh and try again.", StatusCodes.Status409Conflict);
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return ApiResponse<AdminCustomerDetailsResponse>.Fail("Another customer already uses this email address.", StatusCodes.Status409Conflict);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return Cancelled<AdminCustomerDetailsResponse>();
        }
        catch (Exception exception) when (exception is DbException or InvalidOperationException)
        {
            logger.LogError(exception, "Database error updating customer {CustomerId}.", customerId);
            return DatabaseFailure<AdminCustomerDetailsResponse>();
        }
    }

    private async Task<AdminCustomerDetailsResponse?> BuildDetailsAsync(Guid customerId, CancellationToken cancellationToken)
    {
        var customer = await db.Customers.AsNoTracking()
            .Where(x => x.Id == customerId)
            .Select(x => new
            {
                x.Id, x.FullName, x.MobileNumber, x.Email, x.City, x.State, x.PostalCode,
                x.IsDeleted, x.IsBlocked, x.IsActive, x.BlockReason, x.BlockedOn,
                x.IsMobileVerified, x.IsEmailVerified, x.IsProfileCompleted,
                x.MarketingConsent, x.MarketingConsentOn, x.LastLoginOn,
                x.CreatedOn, x.UpdatedOn, x.DeletedOn, x.ConcurrencyStamp,
                ReviewCount = db.Reviews.Count(review => review.CustomerId == x.Id),
                ActiveCartCount = x.Carts.Count(cart => cart.Status == CartStatus.Active),
                ConvertedCartCount = x.Carts.Count(cart => cart.Status == CartStatus.Converted),
                ActiveSessionCount = x.RefreshTokens.Count(token => token.RevokedOn == null && token.ExpiresOn > DateTime.UtcNow)
            })
            .SingleOrDefaultAsync(cancellationToken);
        if (customer is null) return null;

        var addresses = await db.CustomerAddresses.AsNoTracking()
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.IsDefaultShipping)
            .ThenByDescending(x => x.IsActive)
            .ThenByDescending(x => x.UpdatedOn)
            .ToListAsync(cancellationToken);
        var addressResponses = addresses.Select(x => new AdminCustomerAddressResponse(
            x.Id, x.RecipientName, x.MobileNumber, x.AddressLine1, x.AddressLine2,
            x.City, x.State, x.PostalCode, x.Landmark, x.AddressType.ToString(),
            x.IsDefaultShipping, x.IsDefaultBilling, x.IsActive, x.CreatedOn, x.UpdatedOn)).ToList();

        var status = customer.IsDeleted ? AdminCustomerStatuses.Deleted
            : customer.IsBlocked ? AdminCustomerStatuses.Blocked
            : customer.IsActive ? AdminCustomerStatuses.Active
            : AdminCustomerStatuses.Inactive;
        return new AdminCustomerDetailsResponse(
            customer.Id, customer.FullName, customer.MobileNumber, customer.Email,
            customer.City, customer.State, customer.PostalCode, status,
            customer.BlockReason, customer.BlockedOn, customer.IsMobileVerified,
            customer.IsEmailVerified, customer.IsProfileCompleted, customer.MarketingConsent,
            customer.MarketingConsentOn, customer.LastLoginOn, customer.CreatedOn,
            customer.UpdatedOn, customer.DeletedOn, customer.ReviewCount,
            customer.ActiveCartCount, customer.ConvertedCartCount, customer.ActiveSessionCount,
            customer.ConcurrencyStamp, addressResponses);
    }

    private static string? NullIfWhiteSpace(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ApiResponse<T> ValidationFailure<T>(ValidationResult validation) => ApiResponse<T>.Fail(
        "Customer validation failed.",
        StatusCodes.Status400BadRequest,
        validation.Errors.GroupBy(error => error.PropertyName)
            .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).Distinct().ToArray()));

    private static ApiResponse<T> Cancelled<T>() => ApiResponse<T>.Fail(
        "The customer request was cancelled before completion.", StatusCodes.Status408RequestTimeout);

    private static ApiResponse<T> DatabaseFailure<T>() => ApiResponse<T>.Fail(
        "A database error occurred while processing the customer. Please try again.", StatusCodes.Status500InternalServerError);
}
