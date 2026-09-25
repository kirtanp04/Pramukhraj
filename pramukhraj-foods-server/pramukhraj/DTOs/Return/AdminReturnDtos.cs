using pramukhraj.Entities.Return;

namespace pramukhraj.DTOs.Return;

public sealed record AdminReturnFilterRequest(
    ReturnStatus? Status = null,
    string? SearchQuery = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    int Page = 1,
    int PageSize = 10);

public sealed record AdminReturnSummaryResponse(
    Guid Id,
    string ReturnNumber,
    Guid OrderId,
    string OrderNumber,
    Guid CustomerId,
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    ReturnStatus Status,
    ReturnReason Reason,
    ReturnResolution Resolution,
    int TotalItemCount,
    decimal TotalRefundAmount,
    decimal ReverseShippingDeduction,
    decimal NetRefundAmount,
    DateTime CreatedOn,
    DateTime UpdatedOn);

public sealed record AdminReturnDetailsResponse(
    Guid Id,
    string ReturnNumber,
    Guid OrderId,
    string OrderNumber,
    Guid CustomerId,
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    ReturnStatus Status,
    ReturnReason Reason,
    ReturnResolution Resolution,
    string CustomerComments,
    string? AdminNotes,
    string? RejectionReason,
    decimal TotalRefundAmount,
    decimal ReverseShippingDeduction,
    decimal NetRefundAmount,
    DateTime CreatedOn,
    DateTime UpdatedOn,
    DateTime? ApprovedOn,
    DateTime? ReceivedOn,
    DateTime? InspectedOn,
    DateTime? CompletedOn,
    string ConcurrencyStamp,
    IReadOnlyList<AdminReturnItemDetailDto> Items,
    IReadOnlyList<CustomerReturnMediaDto> Media,
    IReadOnlyList<AdminReturnTimelineDto> Timeline,
    AdminRefundDetailDto? Refund,
    string? CourierName = null,
    string? TrackingNumber = null,
    string? TrackingUrl = null,
    DateTime? PickupScheduledDate = null,
    DateTime? PickedUpOn = null,
    DateTime? DeliveredToWarehouseOn = null,
    Guid? ReplacementOrderId = null,
    string? ReplacementOrderNumber = null,
    string? StoreAddress = null,
    string? StoreName = null,
    string? SupportPhone = null,
    string? SupportEmail = null,
    bool? PolicyRefundProductAmount = null,
    bool? PolicyRefundShippingAmount = null,
    bool? PolicyRefundPaymentFee = null,
    decimal ProductRefundAmount = 0,
    decimal ShippingRefundAmount = 0,
    decimal PaymentFeeRefundAmount = 0);

public sealed record AdminReturnItemDetailDto(
    Guid Id,
    Guid OrderItemId,
    Guid ProductVariantId,
    string ProductName,
    string VariantName,
    int Quantity,
    decimal UnitPrice,
    decimal RefundAmount,
    InspectionOutcome InspectionStatus,
    bool RestockInventory);

public sealed record AdminReturnTimelineDto(
    Guid Id,
    ReturnStatus Status,
    string? Note,
    Guid? ActorAdminId,
    string? ActorAdminName,
    DateTime CreatedOn);

public sealed record AdminRefundDetailDto(
    Guid Id,
    string IdempotencyKey,
    string? ProviderRefundId,
    decimal Amount,
    long AmountPaise,
    string Currency,
    RefundStatus Status,
    string RefundSpeed,
    string? FailureReason,
    DateTime CreatedOn,
    DateTime? SettledOn);

public sealed record AdminApproveReturnRequest(
    decimal ReverseShippingDeduction = 0,
    string? AdminNotes = null);

public sealed record AdminRejectReturnRequest(
    string RejectionReason);

public sealed record AdminInspectReturnRequest(
    IReadOnlyList<AdminItemInspectionResult> Items,
    string? InspectionNotes = null);

public sealed record AdminItemInspectionResult(
    Guid ReturnItemId,
    InspectionOutcome Outcome,
    bool RestockInventory);

public sealed record AdminProcessRefundRequest(
    string? RefundSpeed = "normal");

public sealed record AdminFulfillReplacementRequest(
    string? Notes = null);

public sealed record ScheduleReversePickupRequest(
    string CourierName,
    string TrackingNumber,
    string? TrackingUrl = null,
    DateTime? PickupScheduledDate = null,
    string? Notes = null);

public sealed record UpdateReverseTrackingRequest(
    ReturnStatus Status,
    string? Notes = null);

public sealed record AdminReturnStatusCounts(
    int Total,
    int Requested,
    int Approved,
    int Rejected,
    int PickupScheduled,
    int InTransit,
    int DeliveredToWarehouse,
    int InspectionPassed,
    int InspectionFailed,
    int RefundCompleted,
    int Cancelled);

public sealed record AdminReturnListPageResponse(
    IReadOnlyList<AdminReturnSummaryResponse> Returns,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages,
    AdminReturnStatusCounts StatusCounts);

public sealed record ReverseCourierOptionDto(
    int CourierCompanyId,
    string CourierName,
    decimal FreightCharge,
    int? EstimatedDeliveryDays,
    DateTime? EstimatedDeliveryDate,
    decimal? Rating,
    bool IsRecommended);

public sealed record BookReversePickupRequest(
    int? CourierCompanyId = null,
    string? CourierName = null,
    DateTime? PickupScheduledDate = null,
    string? Notes = null);

public sealed record ReverseBookingResult(
    bool Success,
    string? AwbCode,
    string? CourierName,
    long ProviderOrderId,
    long ProviderShipmentId,
    string? Message);

public sealed record ReturnReasonPolicyDto(
    ReturnReason Reason,
    string ReasonName,
    bool RefundProductAmount,
    bool RefundShippingAmount,
    bool RefundPaymentFee,
    DateTime UpdatedOn);

public sealed record UpdateReturnReasonPoliciesRequest(
    List<UpdateReturnReasonPolicyItem> Policies);

public sealed record UpdateReturnReasonPolicyItem(
    ReturnReason Reason,
    bool RefundProductAmount,
    bool RefundShippingAmount,
    bool RefundPaymentFee);



