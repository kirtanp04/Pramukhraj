namespace pramukhraj.DTOs.Checkout;

public sealed record InitializeCheckoutRequest(Guid? ShippingAddressId, Guid? BillingAddressId);
public sealed record UpdateCheckoutAddressRequest(Guid? ShippingAddressId, Guid? BillingAddressId);
public sealed record ApplyCheckoutCouponRequest(string CouponCode);

public sealed record CheckoutItemResponse(
    Guid ProductId,
    Guid ProductVariantId,
    string ProductName,
    string ProductSlug,
    string VariantName,
    string Sku,
    int Quantity,
    decimal UnitPrice,
    decimal UnitMrp,
    decimal LineSubtotal,
    decimal LineMrp,
    decimal LineDiscount,
    decimal WeightKg,
    string ImageUrl);

public sealed record CheckoutShippingQuoteResponse(
    int CourierCompanyId,
    string CourierName,
    string DeliveryMethod,
    decimal ProviderRate,
    decimal CustomerRate,
    int? EstimatedDeliveryDays,
    int? EstimatedDeliveryMaxDays,
    DateTime? EstimatedDeliveryDate,
    DateTime? EstimatedDeliveryMaxDate,
    decimal? Rating,
    bool IsRecommended,
    DateTime QuoteExpiresOn);

public sealed record CheckoutPricingResponse(
    decimal MrpTotal,
    decimal Subtotal,
    decimal ItemDiscountAmount,
    decimal CouponDiscountAmount,
    decimal TaxableAmount,
    decimal ProductTaxAmount,
    decimal PaymentServiceTaxAmount,
    decimal TaxAmount,
    decimal CustomerShippingAmount,
    decimal ProviderShippingCost,
    decimal GrandTotal,
    string Currency,
    bool TaxIncluded,
    decimal TaxRatePercent,
    decimal PaymentServiceTaxRatePercent);

public sealed record CheckoutSessionResponse(
    Guid CheckoutSessionId,
    Guid CartId,
    int CartVersion,
    Guid? ShippingAddressId,
    Guid? BillingAddressId,
    Guid? CouponId,
    string? CouponCode,
    IReadOnlyList<CheckoutItemResponse> Items,
    CheckoutPricingResponse Pricing,
    CheckoutShippingQuoteResponse? ShippingQuote,
    bool IsReadyForPayment,
    IReadOnlyList<string> Warnings,
    DateTime ExpiresOn,
    string ConcurrencyStamp);

public sealed record PricingLine(Guid ProductId, Guid CategoryId, decimal UnitPrice, decimal UnitMrp, int Quantity);
public sealed record PricingCalculationRequest(
    IReadOnlyList<PricingLine> Lines,
    decimal CouponDiscount,
    decimal CustomerShippingAmount,
    decimal ProviderShippingCost,
    decimal TaxRatePercent,
    decimal PaymentServiceTaxRatePercent);

public sealed record ShippingRateRequest(string DeliveryPostalCode, decimal WeightKg, decimal DeclaredValue);
public sealed record ShippingRateResult(
    int CourierCompanyId,
    string CourierName,
    decimal Rate,
    int? EstimatedDeliveryDays,
    DateTime? EstimatedDeliveryDate,
    decimal? Rating,
    bool IsRecommended,
    DateTime QuoteExpiresOn);
