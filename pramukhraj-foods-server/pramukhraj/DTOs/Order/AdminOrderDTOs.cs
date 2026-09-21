namespace pramukhraj.DTOs.Order;

public static class AdminOrderStatuses
{
    public const string All = "ALL";
    public const string PendingPayment = "PendingPayment";
    public const string Confirmed = "Confirmed";
    public const string PaymentFailed = "PaymentFailed";
    public const string Cancelled = "Cancelled";
    public const string Expired = "Expired";
}

public sealed class AdminOrderListRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string Status { get; set; } = AdminOrderStatuses.All;
    public string? PaymentStatus { get; set; }
    public string? ShipmentStatus { get; set; }
    public string SortBy { get; set; } = "createdOn";
    public string SortDirection { get; set; } = "desc";
}

public sealed record AdminOrderCustomerSummary(
    Guid CustomerId,
    string FullName,
    string MobileNumber,
    string? Email,
    string? City,
    string? State,
    bool IsBlocked);

public sealed record AdminOrderItemSummary(
    Guid ProductId,
    Guid ProductVariantId,
    string ProductName,
    string ProductSlug,
    string VariantName,
    string Sku,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record AdminOrderListItemResponse(
    Guid Id,
    string OrderNumber,
    DateTime CreatedOn,
    string OrderStatus,
    string PaymentStatus,
    string? ShipmentStatus,
    string? CourierName,
    string? AwbCode,
    string? TrackingUrl,
    DateTime? EstimatedDeliveryOn,
    decimal GrandTotal,
    string Currency,
    int ItemCount,
    AdminOrderCustomerSummary Customer,
    IReadOnlyList<AdminOrderItemSummary> Items);

public sealed record AdminOrderSummaryResponse(
    int Total,
    int PendingPayment,
    int Confirmed,
    int PaymentFailed,
    int Cancelled,
    int Expired);

public sealed record AdminOrderListPageResponse(
    IReadOnlyList<AdminOrderListItemResponse> Items,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages,
    AdminOrderSummaryResponse Summary);

public sealed record AdminOrderDetailItemResponse(
    Guid Id,
    Guid ProductId,
    Guid ProductVariantId,
    string ProductName,
    string ProductSlug,
    string VariantName,
    string Sku,
    string? HsnCode,
    decimal Weight,
    string WeightUnit,
    int Quantity,
    decimal UnitPrice,
    decimal UnitMrp,
    decimal TaxPercentage,
    decimal TaxableAmount,
    decimal DiscountAmount,
    decimal TaxAmount,
    decimal LineTotal);

public sealed record AdminOrderAddressResponse(
    string Type,
    string RecipientName,
    string MobileNumber,
    string? Email,
    string AddressLine1,
    string? AddressLine2,
    string? Landmark,
    string City,
    string State,
    string PostalCode,
    string Country);

public sealed record AdminOrderCustomerDetailResponse(
    Guid Id,
    string FullName,
    string MobileNumber,
    string? Email,
    string? City,
    string? State,
    string? PostalCode,
    bool IsMobileVerified,
    bool IsEmailVerified,
    bool IsProfileCompleted,
    bool IsBlocked,
    string? BlockReason,
    DateTime CreatedOn);

public sealed record AdminPaymentTransactionResponse(
    Guid Id,
    string Type,
    string? ProviderReference,
    string Status,
    string? SafePayloadJson,
    DateTime CreatedOn);

public sealed record AdminOrderPaymentResponse(
    Guid Id,
    string IdempotencyKey,
    string? ProviderOrderId,
    string? ProviderPaymentId,
    string Status,
    long AmountPaise,
    decimal AmountInr,
    string Currency,
    string? LastError,
    DateTime ExpiresOn,
    DateTime CreatedOn,
    DateTime? PaidOn,
    IReadOnlyList<AdminPaymentTransactionResponse> Transactions);

public sealed record AdminShipmentActivityResponse(
    Guid Id,
    string Activity,
    string? Location,
    string? Status,
    DateTime Date);

public sealed record AdminOrderShipmentResponse(
    Guid Id,
    long ProviderOrderId,
    long ProviderShipmentId,
    int? CourierCompanyId,
    string? CourierName,
    string? AwbCode,
    string? TrackingUrl,
    string? LabelUrl,
    string? ManifestUrl,
    decimal ProviderShippingCharge,
    DateTime? EstimatedDeliveryOn,
    string Status,
    string? ProviderStatus,
    int? ProviderStatusCode,
    DateTime? PickupScheduledOn,
    DateTime? ShippedOn,
    DateTime? DeliveredOn,
    string? LastError,
    DateTime CreatedOn,
    DateTime UpdatedOn,
    IReadOnlyList<AdminShipmentActivityResponse> Activities);

public sealed record AdminOrderStatusHistoryResponse(
    Guid Id,
    string Status,
    string? Note,
    DateTime CreatedOn);

public sealed record AdminInventoryReservationResponse(
    Guid Id,
    Guid ProductVariantId,
    int Quantity,
    string Status,
    DateTime ExpiresOn,
    DateTime CreatedOn,
    DateTime? CompletedOn,
    DateTime? ReleasedOn);

public sealed record AdminOrderDetailResponse(
    Guid Id,
    string OrderNumber,
    string Status,
    DateTime CreatedOn,
    DateTime UpdatedOn,
    DateTime PaymentExpiresOn,
    Guid CheckoutSessionId,
    decimal Subtotal,
    decimal ItemDiscountAmount,
    decimal CouponDiscountAmount,
    decimal ShippingAmount,
    decimal ProviderShippingCost,
    decimal TaxAmount,
    decimal ProductTaxAmount,
    decimal PaymentServiceTaxAmount,
    decimal ProductTaxRatePercent,
    decimal PaymentServiceTaxRatePercent,
    decimal GrandTotal,
    string Currency,
    Guid? CouponId,
    string? CouponCode,
    string? CustomerNote,
    AdminOrderCustomerDetailResponse Customer,
    AdminOrderAddressResponse? ShippingAddress,
    AdminOrderAddressResponse? BillingAddress,
    IReadOnlyList<AdminOrderDetailItemResponse> Items,
    IReadOnlyList<AdminOrderPaymentResponse> Payments,
    IReadOnlyList<AdminOrderShipmentResponse> Shipments,
    IReadOnlyList<AdminOrderStatusHistoryResponse> StatusHistory,
    IReadOnlyList<AdminInventoryReservationResponse> InventoryReservations);

