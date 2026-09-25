namespace pramukhraj.DTOs.Settings;

public sealed record StoreSettingsData(
    string SupportEmail,
    string SupportPhoneNumber,
    decimal? TaxRatePercent,
    decimal? PaymentServiceTaxRatePercent,
    string StoreAddress,
    string StoreName,
    decimal FreeShippingMinimumAmount,
    int ReturnWindowDays = 0,
    string? StoreAddressLine1 = null,
    string? StoreAddressLine2 = null,
    string? StoreCity = null,
    string? StoreState = null,
    string? StorePostalCode = null,
    string? StoreCountry = "India");

public sealed record StoreSettingsWriteRequest(
    string SupportEmail,
    string SupportPhoneNumber,
    decimal? TaxRatePercent,
    decimal? PaymentServiceTaxRatePercent,
    string? StoreAddress,
    string StoreName,
    decimal FreeShippingMinimumAmount,
    string? ConcurrencyStamp,
    int ReturnWindowDays = 0,
    string? StoreAddressLine1 = null,
    string? StoreAddressLine2 = null,
    string? StoreCity = null,
    string? StoreState = null,
    string? StorePostalCode = null,
    string? StoreCountry = "India");

public sealed record StoreSettingsResponse(
    string SupportEmail,
    string SupportPhoneNumber,
    decimal TaxRatePercent,
    decimal PaymentServiceTaxRatePercent,
    string StoreAddress,
    string StoreName,
    decimal FreeShippingMinimumAmount,
    DateTime? UpdatedOn,
    string? ConcurrencyStamp,
    int ReturnWindowDays = 0,
    string? StoreAddressLine1 = null,
    string? StoreAddressLine2 = null,
    string? StoreCity = null,
    string? StoreState = null,
    string? StorePostalCode = null,
    string? StoreCountry = "India");

