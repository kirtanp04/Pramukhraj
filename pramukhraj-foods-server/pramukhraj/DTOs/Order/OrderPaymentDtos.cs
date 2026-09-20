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
