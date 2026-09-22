using System.Data;
using System.Data.Common;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Customer;
using pramukhraj.Entities.Customer;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class CustomerAddressService(
    AppDbContext db,
    CustomerClaimsHelper claimsHelper,
    IValidatorManager validatorManager,
    IStoreSettingsService storeSettingsService,
    ILogger<CustomerAddressService> logger) : ICustomerAddressService
{
    public async Task<ApiResponse<IReadOnlyList<CustomerAddressResponse>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var customer = await GetCustomerIdAsync(cancellationToken);
        if (!customer.Success) return Failure<IReadOnlyList<CustomerAddressResponse>>(customer);
        var addresses = await db.CustomerAddresses.AsNoTracking()
            .Where(x => x.CustomerId == customer.Data && x.IsActive)
            .OrderByDescending(x => x.IsDefaultShipping).ThenByDescending(x => x.IsDefaultBilling)
            .ThenByDescending(x => x.UpdatedOn).ToListAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<CustomerAddressResponse>>.Ok(addresses.Select(ToResponse).ToArray());
    }

    public async Task<ApiResponse<CustomerAddressResponse>> GetByIdAsync(Guid addressId, CancellationToken cancellationToken = default)
    {
        if (addressId == Guid.Empty) return ApiResponse<CustomerAddressResponse>.Fail("A valid address ID is required.", 400);
        var customer = await GetCustomerIdAsync(cancellationToken);
        if (!customer.Success) return Failure<CustomerAddressResponse>(customer);
        var address = await db.CustomerAddresses.AsNoTracking().SingleOrDefaultAsync(
            x => x.Id == addressId && x.CustomerId == customer.Data && x.IsActive, cancellationToken);
        return address is null
            ? ApiResponse<CustomerAddressResponse>.Fail("Address was not found.", 404)
            : ApiResponse<CustomerAddressResponse>.Ok(ToResponse(address));
    }

    public async Task<ApiResponse<CustomerAddressResponse>> CreateAsync(
        CustomerAddressWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = await validatorManager.CustomerAddressWriteRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<CustomerAddressResponse>(validation);
        var customer = await GetCustomerIdAsync(cancellationToken);
        if (!customer.Success) return Failure<CustomerAddressResponse>(customer);
        try
        {
            CustomerAddresses? created = null;
            var strategy = db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
                var hasAddress = await db.CustomerAddresses.AnyAsync(x => x.CustomerId == customer.Data && x.IsActive, cancellationToken);
                var now = DateTime.UtcNow;
                created = Build(customer.Data, request, now);
                if (!hasAddress)
                {
                    created.IsDefaultShipping = true;
                    created.IsDefaultBilling = true;
                }
                await ClearDefaultsAsync(customer.Data, created.IsDefaultShipping, created.IsDefaultBilling, null, cancellationToken);
                db.CustomerAddresses.Add(created);
                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            });
            return new ApiResponse<CustomerAddressResponse>
            {
                Success = true, StatusCode = 201, Message = "Address added successfully.", Data = ToResponse(created!)
            };
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception) when (exception is DbException or DbUpdateException)
        {
            logger.LogError(exception, "Database error while creating a customer address.");
            return DatabaseFailure<CustomerAddressResponse>();
        }
    }

    public async Task<ApiResponse<CustomerAddressResponse>> UpdateAsync(
        Guid addressId,
        CustomerAddressWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        if (addressId == Guid.Empty) return ApiResponse<CustomerAddressResponse>.Fail("A valid address ID is required.", 400);
        var validation = await validatorManager.CustomerAddressWriteRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure<CustomerAddressResponse>(validation);
        if (string.IsNullOrWhiteSpace(request.ConcurrencyStamp))
            return ApiResponse<CustomerAddressResponse>.Fail("Refresh the address before updating it.", 409);
        var customer = await GetCustomerIdAsync(cancellationToken);
        if (!customer.Success) return Failure<CustomerAddressResponse>(customer);
        try
        {
            CustomerAddresses? address = null;
            var strategy = db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
                address = await db.CustomerAddresses.SingleOrDefaultAsync(
                    x => x.Id == addressId && x.CustomerId == customer.Data && x.IsActive, cancellationToken);
                if (address is null) return;
                if (!string.Equals(address.ConcurrencyStamp, request.ConcurrencyStamp, StringComparison.Ordinal))
                    throw new AddressConcurrencyException();
                await ClearDefaultsAsync(customer.Data, request.IsDefaultShipping, request.IsDefaultBilling, addressId, cancellationToken);
                Apply(address, request, DateTime.UtcNow);
                await InvalidateShippingQuotesAsync(customer.Data, addressId, false, cancellationToken);
                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            });
            return address is null
                ? ApiResponse<CustomerAddressResponse>.Fail("Address was not found.", 404)
                : ApiResponse<CustomerAddressResponse>.Ok(ToResponse(address), "Address updated successfully.");
        }
        catch (AddressConcurrencyException)
        {
            return ApiResponse<CustomerAddressResponse>.Fail("This address changed elsewhere. Refresh and try again.", 409);
        }
        catch (DbUpdateConcurrencyException)
        {
            return ApiResponse<CustomerAddressResponse>.Fail("This address changed elsewhere. Refresh and try again.", 409);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception) when (exception is DbException or DbUpdateException)
        {
            logger.LogError(exception, "Database error while updating customer address {AddressId}.", addressId);
            return DatabaseFailure<CustomerAddressResponse>();
        }
    }

    public async Task<ApiResponse<object>> DeleteAsync(Guid addressId, CancellationToken cancellationToken = default)
    {
        var customer = await GetCustomerIdAsync(cancellationToken);
        if (!customer.Success) return Failure<object>(customer);
        var found = false;
        try
        {
            var strategy = db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
                var address = await db.CustomerAddresses.SingleOrDefaultAsync(
                    x => x.Id == addressId && x.CustomerId == customer.Data && x.IsActive, cancellationToken);
                if (address is null) return;
                found = true;
                var wasShipping = address.IsDefaultShipping;
                var wasBilling = address.IsDefaultBilling;
                address.IsActive = false;
                address.IsDefaultShipping = false;
                address.IsDefaultBilling = false;
                address.UpdatedOn = DateTime.UtcNow;
                address.ConcurrencyStamp = Guid.NewGuid().ToString("N");
                await InvalidateShippingQuotesAsync(customer.Data, addressId, true, cancellationToken);
                var replacement = await db.CustomerAddresses
                    .Where(x => x.CustomerId == customer.Data && x.IsActive && x.Id != addressId)
                    .OrderByDescending(x => x.UpdatedOn)
                    .FirstOrDefaultAsync(cancellationToken);
                if (replacement is not null)
                {
                    if (wasShipping) replacement.IsDefaultShipping = true;
                    if (wasBilling) replacement.IsDefaultBilling = true;
                    replacement.UpdatedOn = DateTime.UtcNow;
                    replacement.ConcurrencyStamp = Guid.NewGuid().ToString("N");
                }
                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            });
            return found
                ? ApiResponse<object>.Ok(null, "Address removed successfully.")
                : ApiResponse<object>.Fail("Address was not found.", 404);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception) when (exception is DbException or DbUpdateException)
        {
            logger.LogError(exception, "Database error while deleting customer address {AddressId}.", addressId);
            return DatabaseFailure<object>();
        }
    }

    public Task<ApiResponse<CustomerAddressResponse>> SetDefaultShippingAsync(Guid addressId, CancellationToken cancellationToken = default) =>
        SetDefaultAsync(addressId, true, cancellationToken);
    public Task<ApiResponse<CustomerAddressResponse>> SetDefaultBillingAsync(Guid addressId, CancellationToken cancellationToken = default) =>
        SetDefaultAsync(addressId, false, cancellationToken);

    private async Task<ApiResponse<CustomerAddressResponse>> SetDefaultAsync(Guid addressId, bool shipping, CancellationToken cancellationToken)
    {
        var customer = await GetCustomerIdAsync(cancellationToken);
        if (!customer.Success) return Failure<CustomerAddressResponse>(customer);
        CustomerAddresses? address = null;
        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            address = await db.CustomerAddresses.SingleOrDefaultAsync(
                x => x.Id == addressId && x.CustomerId == customer.Data && x.IsActive, cancellationToken);
            if (address is null) return;
            await ClearDefaultsAsync(customer.Data, shipping, !shipping, addressId, cancellationToken);
            if (shipping) address.IsDefaultShipping = true;
            else address.IsDefaultBilling = true;
            address.UpdatedOn = DateTime.UtcNow;
            address.ConcurrencyStamp = Guid.NewGuid().ToString("N");
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        });
        return address is null
            ? ApiResponse<CustomerAddressResponse>.Fail("Address was not found.", 404)
            : ApiResponse<CustomerAddressResponse>.Ok(ToResponse(address), shipping ? "Default shipping address updated." : "Default billing address updated.");
    }

    private Task ClearDefaultsAsync(Guid customerId, bool shipping, bool billing, Guid? exceptId, CancellationToken cancellationToken) =>
        db.CustomerAddresses.Where(x => x.CustomerId == customerId && x.IsActive && (!exceptId.HasValue || x.Id != exceptId) &&
                ((shipping && x.IsDefaultShipping) || (billing && x.IsDefaultBilling)))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.IsDefaultShipping, x => shipping ? false : x.IsDefaultShipping)
                .SetProperty(x => x.IsDefaultBilling, x => billing ? false : x.IsDefaultBilling)
                .SetProperty(x => x.UpdatedOn, DateTime.UtcNow)
                .SetProperty(x => x.ConcurrencyStamp, Guid.NewGuid().ToString("N")), cancellationToken);

    private async Task InvalidateShippingQuotesAsync(
        Guid customerId,
        Guid addressId,
        bool addressRemoved,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        if (addressRemoved)
        {
            await db.CheckoutSessions
                .Where(x => x.CustomerId == customerId && x.ConsumedOn == null && x.ExpiresOn > now &&
                    x.BillingAddressId == addressId && x.ShippingAddressId != addressId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.BillingAddressId, (Guid?)null)
                    .SetProperty(x => x.UpdatedOn, now)
                    .SetProperty(x => x.ConcurrencyStamp, Guid.NewGuid().ToString("N")), cancellationToken);
        }

        var affectedSessions = await db.CheckoutSessions
            .Where(x => x.CustomerId == customerId && x.ConsumedOn == null && x.ExpiresOn > now &&
                x.ShippingAddressId == addressId)
            .ToListAsync(cancellationToken);
        if (affectedSessions.Count == 0) return;
        var settings = await storeSettingsService.GetCurrentAsync(cancellationToken);
        var paymentServiceRate = Math.Clamp(settings.PaymentServiceTaxRatePercent ?? 0m, 0m, 100m);
        foreach (var session in affectedSessions)
        {
            if (addressRemoved) session.ShippingAddressId = null;
            if (addressRemoved && session.BillingAddressId == addressId) session.BillingAddressId = null;
            session.CustomerShippingAmount = 0m;
            session.ProviderShippingCost = 0m;
            var discountedGoods = Math.Max(0m, session.Subtotal - session.CouponDiscountAmount);
            session.PaymentServiceTaxAmount = Math.Round((discountedGoods + session.ProductTaxAmount) * paymentServiceRate / 100m, 2, MidpointRounding.AwayFromZero);
            session.TaxAmount = session.ProductTaxAmount;
            session.GrandTotal = discountedGoods + session.TaxAmount + session.PaymentServiceTaxAmount;
            session.SelectedCourierId = null; session.SelectedCourierName = null; session.EstimatedDeliveryOn = null;
            session.ShippingQuoteExpiresOn = null; session.ShippingQuoteJson = null;
            session.UpdatedOn = now; session.ConcurrencyStamp = Guid.NewGuid().ToString("N");
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<ApiResponse<Guid>> GetCustomerIdAsync(CancellationToken cancellationToken)
    {
        var claims = claimsHelper.GetCustomer();
        if (!claims.Success || claims.Data is null) return ApiResponse<Guid>.Fail(claims.Message, claims.StatusCode, claims.Errors);
        var valid = await db.Customers.AsNoTracking().AnyAsync(x => x.Id == claims.Data.CustomerId && x.IsActive &&
            !x.IsBlocked && !x.IsDeleted && x.TokenVersion.ToString() == claims.Data.TokenVersion, cancellationToken);
        return valid ? ApiResponse<Guid>.Ok(claims.Data.CustomerId) : ApiResponse<Guid>.Fail("Invalid or expired customer session.", 401);
    }

    private static CustomerAddresses Build(Guid customerId, CustomerAddressWriteRequest request, DateTime now)
    {
        var address = new CustomerAddresses { Id = Guid.NewGuid(), CustomerId = customerId, CreatedOn = now, IsActive = true };
        Apply(address, request, now);
        return address;
    }
    private static void Apply(CustomerAddresses address, CustomerAddressWriteRequest request, DateTime now)
    {
        address.RecipientName = request.RecipientName.Trim();
        address.MobileNumber = request.MobileNumber.Trim();
        address.Email = Null(request.Email)?.ToLowerInvariant();
        address.AddressLine1 = request.AddressLine1.Trim();
        address.AddressLine2 = Null(request.AddressLine2);
        address.Landmark = Null(request.Landmark);
        address.City = request.City.Trim();
        address.State = request.State.Trim();
        address.PostalCode = request.PostalCode.Trim();
        address.Country = "India";
        address.AddressType = Enum.Parse<CustomerAddressType>(request.AddressType.Trim(), true);
        address.IsDefaultShipping = request.IsDefaultShipping;
        address.IsDefaultBilling = request.IsDefaultBilling;
        address.UpdatedOn = now;
        address.ConcurrencyStamp = Guid.NewGuid().ToString("N");
    }
    private static CustomerAddressResponse ToResponse(CustomerAddresses x) => new(
        x.Id, x.RecipientName, x.MobileNumber, x.Email, x.AddressLine1, x.AddressLine2, x.Landmark,
        x.City, x.State, x.PostalCode, x.Country, x.AddressType.ToString(), x.IsDefaultShipping,
        x.IsDefaultBilling, x.ConcurrencyStamp, x.CreatedOn, x.UpdatedOn);
    private static string? Null(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static ApiResponse<T> Failure<T>(ApiResponse<Guid> response) => ApiResponse<T>.Fail(response.Message, response.StatusCode, response.Errors);
    private static ApiResponse<T> ValidationFailure<T>(ValidationResult validation) => ApiResponse<T>.Fail(
        "Please correct the highlighted fields.", 400,
        validation.Errors.GroupBy(x => x.PropertyName).ToDictionary(x => x.Key, x => x.Select(e => e.ErrorMessage).Distinct().ToArray()));
    private static ApiResponse<T> DatabaseFailure<T>() => ApiResponse<T>.Fail("Unable to process addresses right now.", 500);
    private sealed class AddressConcurrencyException : Exception;
}
