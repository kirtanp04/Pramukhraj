namespace pramukhraj.DTOs.Shipment;

public static class AdminShipmentStatuses
{
    public const string All = "ALL";
    public const string PendingPickup = "PendingPickup";
    public const string InTransit = "InTransit";
    public const string Delivered = "Delivered";
    public const string FailedOrRto = "FailedOrRto";

    public const string Created = "Created";
    public const string CourierAssigned = "CourierAssigned";
    public const string AwbAssigned = "AwbAssigned";
    public const string PickupScheduled = "PickupScheduled";
    public const string PickedUp = "PickedUp";
    public const string OutForDelivery = "OutForDelivery";
    public const string DeliveryFailed = "DeliveryFailed";
    public const string RtoInitiated = "RtoInitiated";
    public const string RtoDelivered = "RtoDelivered";
    public const string Cancelled = "Cancelled";
}

public sealed class AdminShipmentListRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string Status { get; set; } = AdminShipmentStatuses.All;
    public string? CourierName { get; set; }
    public string SortBy { get; set; } = "createdOn";
    public string SortDirection { get; set; } = "desc";
}

public sealed record AdminShipmentCustomerSummary(
    Guid CustomerId,
    string FullName,
    string MobileNumber,
    string? Email,
    string? City,
    string? State,
    string? PostalCode,
    bool IsBlocked);

public sealed record AdminShipmentOrderSummary(
    Guid OrderId,
    string OrderNumber,
    string OrderStatus,
    string PaymentStatus,
    decimal GrandTotal,
    string Currency,
    int ItemCount,
    string? SelectedCourierName);

public sealed record AdminShipmentListItemResponse(
    Guid Id,
    Guid OrderId,
    string OrderNumber,
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
    DateTime? PickupScheduledOn,
    DateTime? ShippedOn,
    DateTime? DeliveredOn,
    string? LastError,
    DateTime CreatedOn,
    DateTime UpdatedOn,
    AdminShipmentCustomerSummary Customer,
    AdminShipmentOrderSummary Order,
    int ActivityCount,
    string? LatestActivity,
    string? LatestLocation);

public sealed record AdminShipmentSummaryResponse(
    int Total,
    int PendingPickup,
    int InTransit,
    int Delivered,
    int FailedOrRto,
    decimal TotalShippingCharges);

public sealed record AdminShipmentListPageResponse(
    IReadOnlyList<AdminShipmentListItemResponse> Items,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages,
    AdminShipmentSummaryResponse Summary);

public sealed record AdminShipmentActivityResponse(
    Guid Id,
    Guid ShipmentId,
    string Activity,
    string? Location,
    string? Status,
    DateTime Date,
    DateTime CreatedOn);

public sealed record AdminShipmentDetailItemResponse(
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
    decimal LineTotal);

public sealed record AdminShipmentAddressResponse(
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

public sealed record AdminShipmentOrderDetailResponse(
    Guid Id,
    string OrderNumber,
    string Status,
    string PaymentStatus,
    DateTime CreatedOn,
    decimal Subtotal,
    decimal ShippingAmount,
    decimal TaxAmount,
    decimal GrandTotal,
    string Currency,
    string? CustomerNote,
    AdminShipmentAddressResponse? ShippingAddress,
    AdminShipmentAddressResponse? BillingAddress,
    IReadOnlyList<AdminShipmentDetailItemResponse> Items);

public sealed record AdminShipmentDetailResponse(
    Guid Id,
    Guid OrderId,
    string OrderNumber,
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
    string ConcurrencyStamp,
    AdminShipmentCustomerSummary Customer,
    AdminShipmentOrderDetailResponse Order,
    IReadOnlyList<AdminShipmentActivityResponse> Activities);

