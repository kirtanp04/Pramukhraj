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
    private static readonly StoreSettingsData Defaults = new("", "", 0m, 0m, "", "Store", 0m);

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

            var data = new StoreSettingsData(
                request.SupportEmail.Trim().ToLowerInvariant(), NormalizePhone(request.SupportPhoneNumber),
                Money(request.TaxRatePercent ?? 0m), Money(request.PaymentServiceTaxRatePercent ?? 0m), request.StoreAddress.Trim(), request.StoreName.Trim(),
                Money(request.FreeShippingMinimumAmount));
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
            return new StoreSettingsData(
                value.SupportEmail?.Trim() ?? string.Empty,
                value.SupportPhoneNumber?.Trim() ?? string.Empty,
                Math.Clamp(value.TaxRatePercent ?? 0m, 0m, 100m),
                Math.Clamp(value.PaymentServiceTaxRatePercent ?? 0m, 0m, 100m),
                value.StoreAddress?.Trim() ?? string.Empty,
                string.IsNullOrWhiteSpace(value.StoreName) ? Defaults.StoreName : value.StoreName.Trim(),
                Math.Clamp(value.FreeShippingMinimumAmount, 0m, 10_000_000m));
        }
        catch (JsonException exception)
        {
            logger.LogError(exception, "Stored settings JSON is invalid; safe defaults are being used.");
            return Defaults;
        }
    }

    private static StoreSettingsResponse ToResponse(StoreSettingsData data, StoreSettings? entity) => new(
        data.SupportEmail, data.SupportPhoneNumber, data.TaxRatePercent ?? 0m, data.PaymentServiceTaxRatePercent ?? 0m, data.StoreAddress,
        data.StoreName, data.FreeShippingMinimumAmount, entity?.UpdatedOn, entity?.ConcurrencyStamp);
    private static string NormalizePhone(string value) => new(value.Where(x => char.IsDigit(x) || x == '+').ToArray());
    private static decimal Money(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
    private static ApiResponse<StoreSettingsResponse> ValidationFailure(ValidationResult result) =>
        ApiResponse<StoreSettingsResponse>.Fail("Please correct the highlighted fields.", 400,
            result.Errors.GroupBy(x => x.PropertyName).ToDictionary(x => x.Key, x => x.Select(y => y.ErrorMessage).Distinct().ToArray()));
    private static ApiResponse<T> Failure<T>() => ApiResponse<T>.Fail("Unable to process store settings right now. Please try again.", 500);
}
