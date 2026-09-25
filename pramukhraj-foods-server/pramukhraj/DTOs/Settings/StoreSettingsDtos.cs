namespace pramukhraj.DTOs.Settings;

public sealed record StoreSettingsData(
    string SupportEmail,
    string SupportPhoneNumber,
    decimal? TaxRatePercent,
    decimal? PaymentProcessingFee,
    string StoreAddress,
    string StoreName,
    decimal FreeShippingMinimumAmount,
    int ReturnWindowDays = 0,
    string? StoreAddressLine1 = null,
    string? StoreAddressLine2 = null,
    string? StoreCity = null,
    string? StoreState = null,
    string? StorePostalCode = null,
    string? StoreCountry = "India",
    decimal? PaymentServiceTaxRatePercent = null);

public sealed record StoreSettingsWriteRequest(
    string SupportEmail,
    string SupportPhoneNumber,
    decimal? TaxRatePercent,
    decimal? PaymentProcessingFee,
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
    string? StoreCountry = "India",
    decimal? PaymentServiceTaxRatePercent = null);

public sealed record StoreSettingsResponse(
    string SupportEmail,
    string SupportPhoneNumber,
    decimal TaxRatePercent,
    decimal PaymentProcessingFee,
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
    string? StoreCountry = "India",
    decimal PaymentServiceTaxRatePercent = 0m);

