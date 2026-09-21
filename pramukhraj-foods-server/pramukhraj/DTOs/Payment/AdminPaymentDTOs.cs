namespace pramukhraj.DTOs.Payment;

public static class AdminPaymentStatuses
{
    public const string All = "ALL";
    public const string Paid = "Paid";
    public const string Pending = "Pending";
    public const string ProviderOrderCreated = "ProviderOrderCreated";
    public const string Failed = "Failed";
    public const string Expired = "Expired";
    public const string VerificationFailed = "VerificationFailed";
}

public sealed class AdminPaymentListRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string Status { get; set; } = AdminPaymentStatuses.All;
    public string SortBy { get; set; } = "createdOn";
    public string SortDirection { get; set; } = "desc";
}

public sealed record AdminPaymentCustomerSummary(
    Guid CustomerId,
    string FullName,
    string MobileNumber,
    string? Email,
    string? City,
    string? State,
    bool IsBlocked);

public sealed record AdminPaymentOrderSummary(
    Guid OrderId,
    string OrderNumber,
    string OrderStatus,
    decimal GrandTotal,
    string Currency,
    int ItemCount);

public sealed record AdminPaymentListItemResponse(
    Guid Id,
    Guid OrderId,
    string OrderNumber,
    string IdempotencyKey,
    string? ProviderOrderId,
    string? ProviderPaymentId,
    string Status,
    long AmountPaise,
    decimal Amount,
    string Currency,
    string? LastError,
    DateTime ExpiresOn,
    DateTime CreatedOn,
    DateTime UpdatedOn,
    DateTime? PaidOn,
    AdminPaymentCustomerSummary Customer,
    AdminPaymentOrderSummary Order);

public sealed record AdminPaymentSummaryResponse(
    int Total,
    int Paid,
    int Pending,
    int Failed,
    int Expired,
    decimal TotalPaidAmount);

public sealed record AdminPaymentListPageResponse(
    IReadOnlyList<AdminPaymentListItemResponse> Items,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages,
    AdminPaymentSummaryResponse Summary);

public sealed record AdminPaymentTransactionDetailResponse(
    Guid Id,
    Guid PaymentId,
    string Type,
    string? ProviderReference,
    string Status,
    string? SafePayloadJson,
    DateTime CreatedOn);

public sealed record AdminPaymentDetailItemResponse(
    Guid Id,
    Guid ProductId,
    Guid ProductVariantId,
    string ProductName,
    string ProductSlug,
    string VariantName,
    string Sku,
    decimal Weight,
    string WeightUnit,
    int Quantity,
    decimal UnitPrice,
    decimal UnitMrp,
    decimal TaxPercentage,
    decimal DiscountAmount,
    decimal TaxAmount,
    decimal LineTotal);

public sealed record AdminPaymentAddressResponse(
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

public sealed record AdminPaymentOrderDetailResponse(
    Guid Id,
    string OrderNumber,
    string Status,
    DateTime CreatedOn,
    decimal Subtotal,
    decimal ItemDiscountAmount,
    decimal CouponDiscountAmount,
    decimal ShippingAmount,
    decimal TaxAmount,
    decimal GrandTotal,
    string Currency,
    string? CouponCode,
    string? CustomerNote,
    AdminPaymentAddressResponse? ShippingAddress,
    AdminPaymentAddressResponse? BillingAddress,
    IReadOnlyList<AdminPaymentDetailItemResponse> Items);

public sealed record AdminPaymentShipmentSummaryResponse(
    string? AwbCode,
    string? CourierName,
    string Status,
    string? TrackingUrl,
    DateTime? EstimatedDeliveryOn);

public sealed record AdminPaymentDetailResponse(
    Guid Id,
    Guid OrderId,
    string OrderNumber,
    string IdempotencyKey,
    string? ProviderOrderId,
    string? ProviderPaymentId,
    string Status,
    long AmountPaise,
    decimal Amount,
    string Currency,
    string? LastError,
    DateTime ExpiresOn,
    DateTime CreatedOn,
    DateTime UpdatedOn,
    DateTime? PaidOn,
    string ConcurrencyStamp,
    AdminPaymentCustomerSummary Customer,
    AdminPaymentOrderDetailResponse Order,
    AdminPaymentShipmentSummaryResponse? Shipment,
    IReadOnlyList<AdminPaymentTransactionDetailResponse> Transactions);

