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
    AdminRefundDetailDto? Refund);

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

public sealed record AdminReturnStatusCounts(
    int Total,
    int Requested,
    int Approved,
    int Rejected,
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

