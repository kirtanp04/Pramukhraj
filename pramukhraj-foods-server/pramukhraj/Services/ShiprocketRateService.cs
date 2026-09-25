using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using pramukhraj.Common;
using pramukhraj.DTOs.Checkout;
using pramukhraj.DTOs.ProviderCredentials;
using pramukhraj.Entities.ProviderCredentials;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed partial class ShiprocketRateService(
    HttpClient httpClient,
    IProviderCredentialService providerCredentialService,
    ICacheService cache,
    ILogger<ShiprocketRateService> logger) : IShiprocketRateService
{
    private const string TokenCacheKey = "provider:shiprocket:access-token";

    public async Task<ShippingRateResult> GetBestRateAsync(
        ShippingRateRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!IndianPostalCode().IsMatch(request.DeliveryPostalCode))
            throw new ShiprocketProviderException("The delivery postal code is invalid.", 422);
        if (request.WeightKg <= 0)
            throw new ShiprocketProviderException("The shipment weight is invalid.", 422);

        var credentials = await GetCredentialsAsync(cancellationToken);
        var pickupPostcode = credentials.PickupPostalCode?.Trim();
        if (string.IsNullOrWhiteSpace(pickupPostcode) || !IndianPostalCode().IsMatch(pickupPostcode))
        {
            var cachedSettings = await cache.GetAsync<DTOs.Settings.StoreSettingsData>(CacheKey.Store.Settings, cancellationToken);
            if (cachedSettings is not null && !string.IsNullOrWhiteSpace(cachedSettings.StorePostalCode) && IndianPostalCode().IsMatch(cachedSettings.StorePostalCode.Trim()))
            {
                pickupPostcode = cachedSettings.StorePostalCode.Trim();
            }
        }

        if (string.IsNullOrWhiteSpace(pickupPostcode) || !IndianPostalCode().IsMatch(pickupPostcode) || credentials.MinimumChargeableWeightKg <= 0)
            throw new ShiprocketProviderException("Shiprocket pickup settings are incomplete.", 503);
        var chargeableWeight = NormalizeWeight(request.WeightKg, credentials.MinimumChargeableWeightKg);
        var path = string.Create(CultureInfo.InvariantCulture,
            $"courier/serviceability/?pickup_postcode={pickupPostcode}&delivery_postcode={request.DeliveryPostalCode}&weight={chargeableWeight:0.###}&cod=0&declared_value={Math.Max(0, request.DeclaredValue):0.00}");
        using var response = await SendAuthorizedAsync(path, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Shiprocket serviceability returned status {StatusCode}.", (int)response.StatusCode);
            throw new ShiprocketProviderException(
                response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.UnprocessableEntity
                    ? "Shipping is unavailable for this address or package."
                    : "Shipping rates are temporarily unavailable. Please try again.",
                response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.UnprocessableEntity ? 422 : 503);
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var couriers = ReadCouriers(document.RootElement).Where(x => x.Rate > 0).ToList();
        if (couriers.Count == 0)
            throw new ShiprocketProviderException("No prepaid courier is currently serviceable for this postal code.", 422);

        var selected = couriers
            .GroupBy(x => x.Id)
            .Select(group => group.OrderBy(x => x.Rate).First())
            .OrderByDescending(x => x.Rating.HasValue)
            .ThenByDescending(x => x.Rating ?? 0)
            .ThenByDescending(x => x.ProviderRecommended)
            .ThenBy(x => x.EstimatedDeliveryDays ?? int.MaxValue)
            .ThenBy(x => x.Rate)
            .First();
        return new ShippingRateResult(
            selected.Id, selected.Name, selected.Rate, selected.EstimatedDeliveryDays,
            selected.EstimatedDeliveryDate, selected.Rating, true,
            DateTime.UtcNow.Add(ShippingDefaults.QuoteLifetime));
    }

    private async Task<HttpResponseMessage> SendAuthorizedAsync(string path, CancellationToken cancellationToken)
    {
        var token = await GetTokenAsync(cancellationToken);
        var response = await SendAsync(path, token, cancellationToken);
        if (response.StatusCode != HttpStatusCode.Unauthorized) return response;
        response.Dispose();
        cache.Remove(TokenCacheKey, "Shiprocket rejected cached access token");
        token = await GetTokenAsync(cancellationToken);
        return await SendAsync(path, token, cancellationToken);
    }

    private async Task<HttpResponseMessage> SendAsync(string path, string token, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
    }

    private Task<string> GetTokenAsync(CancellationToken cancellationToken) => cache.GetOrCreateAsync(
        TokenCacheKey,
        async token =>
        {
            var credentials = await GetCredentialsAsync(token);
            if (string.IsNullOrWhiteSpace(credentials.Email) || string.IsNullOrWhiteSpace(credentials.Password))
                throw new ShiprocketProviderException("Shiprocket credentials are incomplete.", 503);
            using var response = await httpClient.PostAsJsonAsync("auth/login", new
            {
                email = credentials.Email.Trim(),
                password = credentials.Password
            }, token);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Shiprocket authentication failed with status {StatusCode}.", (int)response.StatusCode);
                throw new ShiprocketProviderException("The shipping provider is unavailable.", 503);
            }
            await using var stream = await response.Content.ReadAsStreamAsync(token);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: token);
            if (!document.RootElement.TryGetProperty("token", out var tokenElement) ||
                string.IsNullOrWhiteSpace(tokenElement.GetString()))
                throw new ShiprocketProviderException("The shipping provider returned an invalid authentication response.", 503);
            return tokenElement.GetString()!;
        }, TimeSpan.FromDays(9), size: 1, cancellationToken: cancellationToken);

    private static IEnumerable<CourierOption> ReadCouriers(JsonElement root)
    {
        if (!root.TryGetProperty("data", out var data) ||
            !data.TryGetProperty("available_courier_companies", out var values) ||
            values.ValueKind != JsonValueKind.Array) yield break;
        foreach (var value in values.EnumerateArray())
        {
            var id = Int(value, "courier_company_id");
            var name = Text(value, "courier_name");
            var rate = Decimal(value, "rate") ?? Decimal(value, "freight_charge");
            if (id is null || string.IsNullOrWhiteSpace(name) || rate is null) continue;
            var etdText = Text(value, "etd");
            yield return new CourierOption(
                id.Value, name, Math.Round(rate.Value, 2, MidpointRounding.AwayFromZero),
                Int(value, "estimated_delivery_days") ?? FirstInteger(etdText),
                Date(value, "etd"), Decimal(value, "rating"),
                Bool(value, "is_recommended") || Bool(value, "recommended_by_shiprocket"));
        }
    }

    private static string? Text(JsonElement value, string name) =>
        value.TryGetProperty(name, out var item) && item.ValueKind == JsonValueKind.String ? item.GetString() : null;
    private static decimal? Decimal(JsonElement value, string name)
    {
        if (!value.TryGetProperty(name, out var item)) return null;
        if (item.ValueKind == JsonValueKind.Number && item.TryGetDecimal(out var number)) return number;
        return item.ValueKind == JsonValueKind.String && decimal.TryParse(item.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out number) ? number : null;
    }
    private static int? Int(JsonElement value, string name)
    {
        if (!value.TryGetProperty(name, out var item)) return null;
        if (item.ValueKind == JsonValueKind.Number && item.TryGetInt32(out var number)) return number;
        return item.ValueKind == JsonValueKind.String && int.TryParse(item.GetString(), out number) ? number : null;
    }
    private static bool Bool(JsonElement value, string name) => value.TryGetProperty(name, out var item) &&
        (item.ValueKind == JsonValueKind.True || (item.ValueKind == JsonValueKind.Number && item.TryGetInt32(out var number) && number == 1));
    private static DateTime? Date(JsonElement value, string name) =>
        DateTime.TryParse(Text(value, name), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var date) ? date.ToUniversalTime() : null;
    private static int? FirstInteger(string? value) => value is not null && Number().Match(value) is { Success: true } match &&
        int.TryParse(match.Value, out var number) ? number : null;
    private async Task<ShiprocketProviderCredentials> GetCredentialsAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await providerCredentialService.GetRequiredAsync<ShiprocketProviderCredentials>(ProviderKey.Shiprocket, cancellationToken);
        }
        catch (ProviderCredentialException exception)
        {
            throw new ShiprocketProviderException(exception.Message, 503);
        }
    }

    private static decimal NormalizeWeight(decimal weight, decimal minimumChargeableWeightKg) =>
        Math.Ceiling(Math.Max(weight, minimumChargeableWeightKg) * 2m) / 2m;

    [GeneratedRegex("^[1-9][0-9]{5}$")]
    private static partial Regex IndianPostalCode();
    [GeneratedRegex("[0-9]+")]
    private static partial Regex Number();
    private sealed record CourierOption(
        int Id, string Name, decimal Rate, int? EstimatedDeliveryDays,
        DateTime? EstimatedDeliveryDate, decimal? Rating, bool ProviderRecommended);
}

public sealed class ShiprocketProviderException(string message, int statusCode) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}
