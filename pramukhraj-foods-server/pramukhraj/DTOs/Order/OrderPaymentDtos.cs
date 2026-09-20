namespace pramukhraj.DTOs.Order;

public sealed record PlaceOrderRequest(Guid CheckoutSessionId, string? CustomerNote);
public sealed record VerifyRazorpayPaymentRequest(string RazorpayOrderId, string RazorpayPaymentId, string RazorpaySignature);
public sealed record RazorpayCheckoutResponse(
    Guid OrderId, string OrderNumber, string KeyId, string RazorpayOrderId,
    long AmountPaise, string Currency, string CustomerName, string? CustomerEmail,
    string CustomerMobile, DateTime PaymentExpiresOn, string StoreName,
    bool IsUpiPaymentEnabled, bool IsCardPaymentEnabled);
public sealed record PlaceOrderResponse(Guid OrderId, string OrderNumber, string OrderStatus,
    string PaymentStatus, RazorpayCheckoutResponse? Payment, string? PaymentError);
public sealed record PaymentStatusResponse(Guid OrderId, string OrderNumber, string OrderStatus,
    string PaymentStatus, bool IsPaid, bool CanRetry, DateTime PaymentExpiresOn);
public sealed record PaymentVerificationResponse(Guid OrderId, string OrderNumber, string OrderStatus, string PaymentStatus, bool IsPaid);

public sealed record PendingOrderItemResponse(
    Guid ProductId,
    Guid ProductVariantId,
    string ProductName,
    string ProductSlug,
    string VariantName,
    string Sku,
    int Quantity,
    decimal UnitPrice,
    decimal UnitMrp,
    decimal LineTotal,
    decimal Weight,
    string WeightUnit);

public sealed record PendingOrderAddressResponse(
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

public sealed record PendingOrderSummaryResponse(
    Guid OrderId,
    string OrderNumber,
    string OrderStatus,
    string PaymentStatus,
    DateTime PaymentExpiresOn,
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
    string? SelectedCourierName,
    DateTime? EstimatedDeliveryOn,
    string StoreName,
    PendingOrderAddressResponse? ShippingAddress,
    PendingOrderAddressResponse? BillingAddress,
    IReadOnlyList<PendingOrderItemResponse> Items,
    bool CanRetry,
    bool IsPaid);

public sealed record CancelPendingOrderResponse(
    Guid OrderId,
    string OrderNumber,
    string Status,
    string Message);
