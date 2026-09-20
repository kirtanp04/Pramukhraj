namespace pramukhraj.DTOs.Settings;

public sealed record StoreSettingsData(
    string SupportEmail,
    string SupportPhoneNumber,
    decimal? TaxRatePercent,
    decimal? PaymentServiceTaxRatePercent,
    string StoreAddress,
    string StoreName,
    decimal FreeShippingMinimumAmount);

public sealed record StoreSettingsWriteRequest(
    string SupportEmail,
    string SupportPhoneNumber,
    decimal? TaxRatePercent,
    decimal? PaymentServiceTaxRatePercent,
    string StoreAddress,
    string StoreName,
    decimal FreeShippingMinimumAmount,
    string? ConcurrencyStamp);

public sealed record StoreSettingsResponse(
    string SupportEmail,
    string SupportPhoneNumber,
    decimal TaxRatePercent,
    decimal PaymentServiceTaxRatePercent,
    string StoreAddress,
    string StoreName,
    decimal FreeShippingMinimumAmount,
    DateTime? UpdatedOn,
    string? ConcurrencyStamp);
