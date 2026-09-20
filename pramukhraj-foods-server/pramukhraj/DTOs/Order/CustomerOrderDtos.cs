using pramukhraj.DTOs.Order;

namespace pramukhraj.DTOs.Order;

public sealed record CustomerOrderListItemResponse(
    Guid OrderId,
    string OrderNumber,
    DateTime OrderDate,
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
    IReadOnlyList<CustomerOrderItemSummaryResponse> Items);

public sealed record CustomerOrderItemSummaryResponse(
    Guid ProductId,
    Guid ProductVariantId,
    string ProductName,
    string ProductSlug,
    string VariantName,
    string Sku,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record CustomerOrderDetailResponse(
    Guid OrderId,
    string OrderNumber,
    DateTime OrderDate,
    string OrderStatus,
    string PaymentStatus,
    string? ShipmentStatus,
    decimal Subtotal,
    decimal ItemDiscountAmount,
    decimal CouponDiscountAmount,
    decimal CustomerShippingAmount,
    decimal TaxAmount,
    decimal ProductTaxAmount,
    decimal PaymentServiceTaxAmount,
    decimal ProductTaxRatePercent,
    decimal PaymentServiceTaxRatePercent,
    decimal GrandTotal,
    string Currency,
    string? CouponCode,
    string? CustomerNote,
    string StoreName,
    PendingOrderAddressResponse? ShippingAddress,
    PendingOrderAddressResponse? BillingAddress,
    IReadOnlyList<PendingOrderItemResponse> Items,
    CustomerOrderShipmentDetailResponse? Shipment,
    bool CanCancel);

public sealed record CustomerOrderShipmentDetailResponse(
    Guid ShipmentId,
    string Status,
    string? CourierName,
    string? AwbCode,
    string? TrackingUrl,
    string? LabelUrl,
    DateTime? EstimatedDeliveryOn,
    DateTime? ShippedOn,
    DateTime? DeliveredOn,
    IReadOnlyList<CustomerShipmentActivityResponse> Activities);

public sealed record CustomerShipmentActivityResponse(
    string Activity,
    string? Location,
    string? Status,
    DateTime Date);

public sealed record CustomerOrderTrackingResponse(
    Guid OrderId,
    string OrderNumber,
    string OrderStatus,
    string? ShipmentStatus,
    string? CourierName,
    string? AwbCode,
    string? TrackingUrl,
    DateTime? EstimatedDeliveryOn,
    IReadOnlyList<TrackingTimelineStep> Steps);

public sealed record TrackingTimelineStep(
    string Title,
    string? Description,
    string? Location,
    DateTime? Timestamp,
    bool IsCompleted,
    bool IsCurrent);

public sealed record CustomerOrderListResponse(
    IReadOnlyList<CustomerOrderListItemResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public sealed record PublicOrderTrackingResponse(
    string OrderNumber,
    string OrderStatus,
    string? ShipmentStatus,
    string? CourierName,
    string? AwbCode,
    string? TrackingUrl,
    DateTime? EstimatedDeliveryOn,
    DateTime? ShippedOn,
    DateTime? DeliveredOn,
    IReadOnlyList<CustomerShipmentActivityResponse> Activities);

