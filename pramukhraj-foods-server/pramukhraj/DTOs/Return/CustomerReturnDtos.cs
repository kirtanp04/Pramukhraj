using pramukhraj.Entities.Return;

namespace pramukhraj.DTOs.Return;

public sealed record ReturnEligibilityResponse(
    bool IsEligible,
    int ReturnWindowDays,
    DateTime? DeliveredOn,
    DateTime? ReturnWindowExpiresOn,
    string? IneligibilityReason,
    IReadOnlyList<EligibleOrderItemDto> Items);

public sealed record EligibleOrderItemDto(
    Guid OrderItemId,
    Guid ProductVariantId,
    string ProductName,
    string VariantName,
    int PurchasedQuantity,
    int AlreadyReturnedQuantity,
    int ReturnableQuantity,
    decimal UnitPrice,
    decimal RefundPerItem,
    bool IsReturnable = true,
    string? NonReturnableReason = null);

public sealed record CreateReturnRequest(
    IReadOnlyList<CreateReturnItemDto> Items,
    ReturnReason Reason,
    ReturnResolution Resolution,
    string CustomerComments,
    IReadOnlyList<CreateReturnMediaDto>? Media);

public sealed record CreateReturnItemDto(
    Guid OrderItemId,
    int Quantity);

public sealed record CreateReturnMediaDto(
    string Url,
    string FileName,
    string ContentType,
    long FileSizeBytes);

public sealed record CustomerReturnSummaryResponse(
    Guid Id,
    string ReturnNumber,
    Guid OrderId,
    string OrderNumber,
    ReturnStatus Status,
    ReturnReason Reason,
    int TotalItemCount,
    decimal NetRefundAmount,
    DateTime CreatedOn,
    DateTime? CompletedOn);

public sealed record CustomerReturnDetailsResponse(
    Guid Id,
    string ReturnNumber,
    Guid OrderId,
    string OrderNumber,
    ReturnStatus Status,
    ReturnReason Reason,
    ReturnResolution Resolution,
    string CustomerComments,
    string? RejectionReason,
    decimal TotalRefundAmount,
    decimal ReverseShippingDeduction,
    decimal NetRefundAmount,
    DateTime CreatedOn,
    DateTime UpdatedOn,
    DateTime? ApprovedOn,
    DateTime? CompletedOn,
    IReadOnlyList<CustomerReturnItemDetailDto> Items,
    IReadOnlyList<CustomerReturnMediaDto> Media,
    IReadOnlyList<CustomerReturnTimelineDto> Timeline,
    CustomerRefundDetailDto? Refund,
    string? CourierName = null,
    string? TrackingNumber = null,
    string? TrackingUrl = null,
    DateTime? PickupScheduledDate = null,
    DateTime? PickedUpOn = null,
    DateTime? DeliveredToWarehouseOn = null,
    DateTime? ReceivedOn = null,
    DateTime? InspectedOn = null,
    Guid? ReplacementOrderId = null,
    string? ReplacementOrderNumber = null);

public sealed record CustomerReturnItemDetailDto(
    Guid Id,
    Guid OrderItemId,
    string ProductName,
    string VariantName,
    int Quantity,
    decimal UnitPrice,
    decimal RefundAmount,
    InspectionOutcome InspectionStatus);

public sealed record CustomerReturnMediaDto(
    Guid Id,
    string Url,
    string FileName);

public sealed record CustomerReturnTimelineDto(
    ReturnStatus Status,
    string? Note,
    DateTime CreatedOn);

public sealed record CustomerRefundDetailDto(
    string? ProviderRefundId,
    decimal Amount,
    RefundStatus Status,
    DateTime? SettledOn);

public sealed record CustomerReturnListPageResponse(
    IReadOnlyList<CustomerReturnSummaryResponse> Returns,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages);

