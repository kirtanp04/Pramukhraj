using System.Data.Common;
using System.Text.Json;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore;
using pramukhraj.Common;
using pramukhraj.Database;
using pramukhraj.DTOs.Settings;
using pramukhraj.Entities.Settings;
using pramukhraj.Interfaces;
using static pramukhraj.Common.AdminActions;

namespace pramukhraj.Services;

public sealed class StoreSettingsService(
    AppDbContext db,
    IValidatorManager validatorManager,
    ICacheService cache,
    IHttpContextAccessor httpContextAccessor,
    ILogger<StoreSettingsService> logger) : IStoreSettingsService
{
    private const int SettingsId = 1;
    private static readonly TimeSpan CacheLifetime = TimeSpan.FromMinutes(30);
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly StoreSettingsData Defaults = new("", "", 0m, 0m, "", "Store", 0m, 0, "", "", "", "", "", "India");

    public async Task<ApiResponse<StoreSettingsResponse>> GetAdminAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await db.StoreSettings.AsNoTracking().SingleOrDefaultAsync(x => x.Id == SettingsId, cancellationToken);
            var data = entity is null ? Defaults : Deserialize(entity.SettingsJson);
            return ApiResponse<StoreSettingsResponse>.Ok(ToResponse(data, entity),
                entity is null ? "Store settings have not been saved yet. Default values were returned." : "Store settings retrieved successfully.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unable to retrieve store settings.");
            return Failure<StoreSettingsResponse>();
        }
    }

    public async Task<ApiResponse<StoreSettingsResponse>> UpdateAsync(StoreSettingsWriteRequest request, CancellationToken cancellationToken = default)
    {
        if (request is null) return ApiResponse<StoreSettingsResponse>.Fail("Store settings are required.", 400);
        var validation = await validatorManager.StoreSettingsWriteRequest.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid) return ValidationFailure(validation);
        var admin = Common.Common.GetAdminClaimInfo(httpContextAccessor);
        if (!admin.Success || admin.Data is null || !Guid.TryParse(admin.Data.Id, out var adminId))
            return ApiResponse<StoreSettingsResponse>.Fail("Authenticated administrator information was not found.", 401);
        try
        {
            var entity = await db.StoreSettings.SingleOrDefaultAsync(x => x.Id == SettingsId, cancellationToken);
            if (entity is not null && !string.Equals(entity.ConcurrencyStamp, request.ConcurrencyStamp, StringComparison.Ordinal))
                return ApiResponse<StoreSettingsResponse>.Fail("Store settings changed elsewhere. Reload and try again.", 409);

            var line1 = request.StoreAddressLine1?.Trim() ?? string.Empty;
            var line2 = request.StoreAddressLine2?.Trim() ?? string.Empty;
            var city = request.StoreCity?.Trim() ?? string.Empty;
            var state = request.StoreState?.Trim() ?? string.Empty;
            var postalCode = request.StorePostalCode?.Trim() ?? string.Empty;
            var country = string.IsNullOrWhiteSpace(request.StoreCountry) ? "India" : request.StoreCountry.Trim();

            var addressParts = new List<string>();
            if (!string.IsNullOrWhiteSpace(line1)) addressParts.Add(line1);
            if (!string.IsNullOrWhiteSpace(line2)) addressParts.Add(line2);
            if (!string.IsNullOrWhiteSpace(city)) addressParts.Add(city);
            if (!string.IsNullOrWhiteSpace(state))
            {
                addressParts.Add(!string.IsNullOrWhiteSpace(postalCode) ? $"{state} - {postalCode}" : state);
            }
            else if (!string.IsNullOrWhiteSpace(postalCode))
            {
                addressParts.Add(postalCode);
            }
            if (!string.IsNullOrWhiteSpace(country)) addressParts.Add(country);

            var formattedAddress = string.Join(", ", addressParts);
            var finalStoreAddress = !string.IsNullOrWhiteSpace(request.StoreAddress)
                ? request.StoreAddress.Trim()
                : formattedAddress;

            var data = new StoreSettingsData(
                request.SupportEmail.Trim().ToLowerInvariant(),
                NormalizePhone(request.SupportPhoneNumber),
                0m,
                Math.Clamp(request.PaymentServiceTaxRatePercent ?? 0m, 0m, 10m),
                finalStoreAddress,
                request.StoreName.Trim(),
                Money(request.FreeShippingMinimumAmount),
                Math.Clamp(request.ReturnWindowDays, 0, 365),
                line1,
                line2,
                city,
                state,
                postalCode,
                country);
            var now = DateTime.UtcNow;
            if (entity is null)
            {
                entity = new StoreSettings { Id = SettingsId, CreatedOn = now };
                db.StoreSettings.Add(entity);
            }
            entity.SettingsJson = JsonSerializer.Serialize(data, JsonOptions);
            entity.UpdatedOn = now;
            entity.ConcurrencyStamp = Guid.NewGuid().ToString("N");
            db.AdminActions.Add(new Entities.AdminAction
            {
                Id = Guid.NewGuid(), AdminId = adminId,
                AdminName = admin.Data.UserName?.Trim() ?? "Unknown Admin",
                Module = AdminActionModules.StoreSettings, Action = AdminActionTypes.Update,
                EntityName = "Store settings", Description = "Updated store, support, tax, and shipping settings.",
                CreatedOn = now
            });
            await db.SaveChangesAsync(cancellationToken);
            cache.Remove(CacheKey.Store.Settings, "Store settings updated");
            return ApiResponse<StoreSettingsResponse>.Ok(ToResponse(data, entity), "Store settings updated successfully.");
        }
        catch (DbUpdateConcurrencyException)
        {
            return ApiResponse<StoreSettingsResponse>.Fail("Store settings changed elsewhere. Reload and try again.", 409);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (DbException exception)
        {
            logger.LogError(exception, "Database error while updating store settings.");
            return Failure<StoreSettingsResponse>();
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unable to update store settings.");
            return Failure<StoreSettingsResponse>();
        }
    }

    public Task<StoreSettingsData> GetCurrentAsync(CancellationToken cancellationToken = default) =>
        cache.GetOrCreateAsync(CacheKey.Store.Settings, async token =>
        {
            var json = await db.StoreSettings.AsNoTracking().Where(x => x.Id == SettingsId)
                .Select(x => x.SettingsJson).SingleOrDefaultAsync(token);
            return string.IsNullOrWhiteSpace(json) ? Defaults : Deserialize(json);
        }, CacheLifetime, cancellationToken: cancellationToken);

    private StoreSettingsData Deserialize(string json)
    {
        try
        {
            var value = JsonSerializer.Deserialize<StoreSettingsData>(json, JsonOptions);
            if (value is null) return Defaults;

            var line1 = value.StoreAddressLine1?.Trim() ?? string.Empty;
            var line2 = value.StoreAddressLine2?.Trim() ?? string.Empty;
            var city = value.StoreCity?.Trim() ?? string.Empty;
            var state = value.StoreState?.Trim() ?? string.Empty;
            var postalCode = value.StorePostalCode?.Trim() ?? string.Empty;
            var country = string.IsNullOrWhiteSpace(value.StoreCountry) ? "India" : value.StoreCountry.Trim();
            var storeAddress = value.StoreAddress?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(line1) && !string.IsNullOrWhiteSpace(storeAddress))
            {
                line1 = storeAddress;
            }

            if (string.IsNullOrWhiteSpace(storeAddress))
            {
                var addressParts = new List<string>();
                if (!string.IsNullOrWhiteSpace(line1)) addressParts.Add(line1);
                if (!string.IsNullOrWhiteSpace(line2)) addressParts.Add(line2);
                if (!string.IsNullOrWhiteSpace(city)) addressParts.Add(city);
                if (!string.IsNullOrWhiteSpace(state))
                {
                    addressParts.Add(!string.IsNullOrWhiteSpace(postalCode) ? $"{state} - {postalCode}" : state);
                }
                else if (!string.IsNullOrWhiteSpace(postalCode))
                {
                    addressParts.Add(postalCode);
                }
                if (!string.IsNullOrWhiteSpace(country)) addressParts.Add(country);
                storeAddress = string.Join(", ", addressParts);
            }

            return new StoreSettingsData(
                value.SupportEmail?.Trim() ?? string.Empty,
                value.SupportPhoneNumber?.Trim() ?? string.Empty,
                0m,
                Math.Clamp(value.PaymentServiceTaxRatePercent ?? 0m, 0m, 10m),
                storeAddress,
                string.IsNullOrWhiteSpace(value.StoreName) ? Defaults.StoreName : value.StoreName.Trim(),
                Math.Clamp(value.FreeShippingMinimumAmount, 0m, 10_000_000m),
                Math.Clamp(value.ReturnWindowDays, 0, 365),
                line1,
                line2,
                city,
                state,
                postalCode,
                country);
        }
        catch (JsonException exception)
        {
            logger.LogError(exception, "Stored settings JSON is invalid; safe defaults are being used.");
            return Defaults;
        }
    }

    private static StoreSettingsResponse ToResponse(StoreSettingsData data, StoreSettings? entity) => new(
        data.SupportEmail,
        data.SupportPhoneNumber,
        data.TaxRatePercent ?? 0m,
        data.PaymentServiceTaxRatePercent ?? 0m,
        data.StoreAddress,
        data.StoreName,
        data.FreeShippingMinimumAmount,
        entity?.UpdatedOn,
        entity?.ConcurrencyStamp,
        data.ReturnWindowDays,
        data.StoreAddressLine1,
        data.StoreAddressLine2,
        data.StoreCity,
        data.StoreState,
        data.StorePostalCode,
        data.StoreCountry);
    private static string NormalizePhone(string value) => new(value.Where(x => char.IsDigit(x) || x == '+').ToArray());
    private static decimal Money(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
    private static ApiResponse<StoreSettingsResponse> ValidationFailure(ValidationResult result) =>
        ApiResponse<StoreSettingsResponse>.Fail("Please correct the highlighted fields.", 400,
            result.Errors.GroupBy(x => x.PropertyName).ToDictionary(x => x.Key, x => x.Select(y => y.ErrorMessage).Distinct().ToArray()));
    private static ApiResponse<T> Failure<T>() => ApiResponse<T>.Fail("Unable to process store settings right now. Please try again.", 500);
}
