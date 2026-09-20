namespace pramukhraj.DTOs.Shipment;

public sealed record ShiprocketCreateOrderRequest(
    string OrderId,
    string OrderDate,
    string PickupLocation,
    string BillingCustomerName,
    string BillingLastName,
    string BillingAddress,
    string? BillingAddress2,
    string BillingCity,
    string BillingPincode,
    string BillingState,
    string BillingCountry,
    string BillingEmail,
    string BillingPhone,
    bool ShippingIsBilling,
    string ShippingCustomerName,
    string ShippingLastName,
    string ShippingAddress,
    string? ShippingAddress2,
    string ShippingCity,
    string ShippingPincode,
    string ShippingCountry,
    string ShippingState,
    string ShippingEmail,
    string ShippingPhone,
    IReadOnlyList<ShiprocketOrderItemDto> OrderItems,
    string PaymentMethod,
    decimal ShippingCharges,
    decimal TotalDiscount,
    decimal SubTotal,
    decimal Length,
    decimal Breadth,
    decimal Height,
    decimal Weight);

public sealed record ShiprocketOrderItemDto(
    string Name,
    string Sku,
    int Units,
    decimal SellingPrice,
    decimal Discount = 0,
    decimal Tax = 0,
    string? Hsn = null);

public sealed record ShiprocketCreateOrderResponse(
    long OrderId,
    long ShipmentId,
    string Status,
    int StatusCode);

public sealed record ShiprocketAssignAwbResponse(
    string AwbCode,
    int? CourierCompanyId,
    string? CourierName);

public sealed record ShiprocketGeneratePickupResponse(
    string? PickupScheduledDate,
    string? PickupTokenNumber);

public sealed record ShiprocketWebhookPayload(
    long? OrderId,
    long? ShipmentId,
    string? Awb,
    string? CurrentStatus,
    int? CurrentStatusCode,
    string? CourierName,
    string? Etd,
    IReadOnlyList<ShiprocketScanActivityDto>? Scans);

public sealed record ShiprocketScanActivityDto(
    string? Date,
    string? Status,
    string? Activity,
    string? Location);

