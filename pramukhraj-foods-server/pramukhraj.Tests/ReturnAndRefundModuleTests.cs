using pramukhraj.DTOs.Return;
using pramukhraj.Entities.Return;
using pramukhraj.Validators.Return;
using Xunit;

namespace pramukhraj.Tests;

public sealed class ReturnAndRefundModuleTests
{
    private readonly CreateReturnRequestValidator _createValidator = new();
    private readonly AdminApproveReturnRequestValidator _approveValidator = new();
    private readonly AdminRejectReturnRequestValidator _rejectValidator = new();
    private readonly AdminInspectReturnRequestValidator _inspectValidator = new();
    private readonly ScheduleReversePickupRequestValidator _pickupValidator = new();
    private readonly UpdateReverseTrackingRequestValidator _updateTrackingValidator = new();

    [Fact]
    public void CreateReturnRequest_ValidData_PassesValidation()
    {
        var request = new CreateReturnRequest(
            Items: [new CreateReturnItemDto(Guid.NewGuid(), 2)],
            Reason: ReturnReason.DamagedInTransit,
            Resolution: ReturnResolution.RefundToSource,
            CustomerComments: "Item packaging arrived crushed and torn.",
            Media: [new CreateReturnMediaDto("https://example.com/photo1.jpg", "photo1.jpg", "image/jpeg", 102400)]);

        var result = _createValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void CreateReturnRequest_EmptyItems_FailsValidation()
    {
        var request = new CreateReturnRequest(
            Items: [],
            Reason: ReturnReason.WrongItemReceived,
            Resolution: ReturnResolution.RefundToSource,
            CustomerComments: "Wrong product delivered.",
            Media: null);

        var result = _createValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateReturnRequest.Items));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-5)]
    public void CreateReturnRequest_InvalidQuantity_FailsValidation(int qty)
    {
        var request = new CreateReturnRequest(
            Items: [new CreateReturnItemDto(Guid.NewGuid(), qty)],
            Reason: ReturnReason.QualityMismatch,
            Resolution: ReturnResolution.RefundToSource,
            CustomerComments: "Defective item received.",
            Media: null);

        var result = _createValidator.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void CreateReturnRequest_EmptyComments_FailsValidation()
    {
        var request = new CreateReturnRequest(
            Items: [new CreateReturnItemDto(Guid.NewGuid(), 1)],
            Reason: ReturnReason.DefectiveOrExpired,
            Resolution: ReturnResolution.RefundToSource,
            CustomerComments: "",
            Media: null);

        var result = _createValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateReturnRequest.CustomerComments));
    }

    [Fact]
    public void CreateReturnRequest_MoreThan5MediaFiles_FailsValidation()
    {
        var mediaList = Enumerable.Range(1, 6)
            .Select(i => new CreateReturnMediaDto($"https://example.com/{i}.jpg", $"{i}.jpg", "image/jpeg", 50000))
            .ToList();

        var request = new CreateReturnRequest(
            Items: [new CreateReturnItemDto(Guid.NewGuid(), 1)],
            Reason: ReturnReason.DamagedInTransit,
            Resolution: ReturnResolution.RefundToSource,
            CustomerComments: "Severe package damage.",
            Media: mediaList);

        var result = _createValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateReturnRequest.Media));
    }

    [Fact]
    public void AdminApproveReturn_Valid_PassesValidation()
    {
        var request = new AdminApproveReturnRequest(ReverseShippingDeduction: 50m, AdminNotes: "Approved for pickup.");
        var result = _approveValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void AdminApproveReturn_NegativeDeduction_FailsValidation()
    {
        var request = new AdminApproveReturnRequest(ReverseShippingDeduction: -10m);
        var result = _approveValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AdminApproveReturnRequest.ReverseShippingDeduction));
    }

    [Fact]
    public void AdminRejectReturn_EmptyReason_FailsValidation()
    {
        var request = new AdminRejectReturnRequest(RejectionReason: "");
        var result = _rejectValidator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(AdminRejectReturnRequest.RejectionReason));
    }

    [Fact]
    public void AdminRejectReturn_ValidReason_PassesValidation()
    {
        var request = new AdminRejectReturnRequest(RejectionReason: "Item was opened and consumed partially.");
        var result = _rejectValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void AdminInspectReturn_ValidInspection_PassesValidation()
    {
        var request = new AdminInspectReturnRequest(
            Items:
            [
                new AdminItemInspectionResult(Guid.NewGuid(), InspectionOutcome.Passed, RestockInventory: true),
                new AdminItemInspectionResult(Guid.NewGuid(), InspectionOutcome.Failed, RestockInventory: false)
            ],
            InspectionNotes: "One item in good condition, one item broken seal.");

        var result = _inspectValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void AdminInspectReturn_PendingOutcome_FailsValidation()
    {
        var request = new AdminInspectReturnRequest(
            Items:
            [
                new AdminItemInspectionResult(Guid.NewGuid(), InspectionOutcome.Pending, RestockInventory: false)
            ]);

        var result = _inspectValidator.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void ProportionalCouponCalculation_ComputesFairRefundShare()
    {
        // Order subtotal = 1000, Coupon = 200 (20% off)
        // Item A = 600 line total (60% of subtotal) -> coupon share = 120 -> net refund = 480
        // Item B = 400 line total (40% of subtotal) -> coupon share = 80 -> net refund = 320
        decimal subtotal = 1000m;
        decimal couponDiscount = 200m;

        decimal itemALineTotal = 600m;
        int itemAQty = 2;

        decimal itemAProportion = itemALineTotal / subtotal;
        decimal itemACouponShare = Math.Round(itemAProportion * couponDiscount, 2, MidpointRounding.AwayFromZero);
        decimal itemANetTotal = itemALineTotal - itemACouponShare;
        decimal itemARefundPerUnit = Math.Round(itemANetTotal / itemAQty, 2, MidpointRounding.AwayFromZero);

        Assert.Equal(120m, itemACouponShare);
        Assert.Equal(480m, itemANetTotal);
        Assert.Equal(240m, itemARefundPerUnit);
    }

    [Fact]
    public void ScheduleReversePickup_ValidData_PassesValidation()
    {
        var request = new ScheduleReversePickupRequest(
            CourierName: "Blue Dart",
            TrackingNumber: "BD982736412IN",
            TrackingUrl: "https://bluedart.com/track/BD982736412IN",
            PickupScheduledDate: DateTime.UtcNow.AddDays(1),
            Notes: "Driver will collect package between 2 PM - 5 PM.");

        var result = _pickupValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("", "BD123")]
    [InlineData("Delhivery", "")]
    public void ScheduleReversePickup_MissingRequiredFields_FailsValidation(string courier, string trackingNumber)
    {
        var request = new ScheduleReversePickupRequest(
            CourierName: courier,
            TrackingNumber: trackingNumber,
            TrackingUrl: null,
            PickupScheduledDate: null,
            Notes: null);

        var result = _pickupValidator.Validate(request);
        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData(ReturnStatus.InTransit)]
    [InlineData(ReturnStatus.DeliveredToWarehouse)]
    public void UpdateReverseTracking_AllowedStatuses_PassesValidation(ReturnStatus status)
    {
        var request = new UpdateReverseTrackingRequest(status, "Carrier scan completed.");
        var result = _updateTrackingValidator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData(ReturnStatus.Requested)]
    [InlineData(ReturnStatus.Approved)]
    [InlineData(ReturnStatus.PickupScheduled)]
    [InlineData(ReturnStatus.InspectionPassed)]
    [InlineData(ReturnStatus.RefundCompleted)]
    [InlineData(ReturnStatus.Rejected)]
    public void UpdateReverseTracking_DisallowedStatuses_FailsValidation(ReturnStatus status)
    {
        var request = new UpdateReverseTrackingRequest(status, "Invalid attempt.");
        var result = _updateTrackingValidator.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void FulfillReplacement_RequestRecord_InitializesProperly()
    {
        var request = new AdminFulfillReplacementRequest("Customer requested instant dispatch");
        Assert.Equal("Customer requested instant dispatch", request.Notes);

        var defaultRequest = new AdminFulfillReplacementRequest();
        Assert.Null(defaultRequest.Notes);
    }

    [Fact]
    public void ReturnRequest_ReplacementTracking_PropertiesBindCorrectly()
    {
        var repOrderId = Guid.NewGuid();
        var r = new ReturnRequest
        {
            Id = Guid.NewGuid(),
            ReturnNumber = "RET-20260923-0001",
            ReplacementOrderId = repOrderId,
            ReplacementOrderNumber = "ORD-REP-20260923120000-123"
        };

        Assert.Equal(repOrderId, r.ReplacementOrderId);
        Assert.Equal("ORD-REP-20260923120000-123", r.ReplacementOrderNumber);
    }

    [Fact]
    public void BookReversePickupRequest_ValidData_PassesValidation()
    {
        var validator = new BookReversePickupRequestValidator();
        var request = new BookReversePickupRequest(
            CourierCompanyId: 24,
            CourierName: "Delhivery Reverse",
            PickupScheduledDate: DateTime.UtcNow.AddDays(1),
            Notes: "Handle delicate sweets box carefully");

        var result = validator.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void BookReversePickupRequest_ExcessiveCourierName_FailsValidation()
    {
        var validator = new BookReversePickupRequestValidator();
        var request = new BookReversePickupRequest(
            CourierCompanyId: 10,
            CourierName: new string('A', 101),
            Notes: null);

        var result = validator.Validate(request);
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(BookReversePickupRequest.CourierName));
    }

    [Fact]
    public void ReverseCourierOptionDto_BindsCorrectly()
    {
        var dto = new ReverseCourierOptionDto(
            CourierCompanyId: 45,
            CourierName: "Blue Dart Surface Reverse",
            FreightCharge: 125.50m,
            EstimatedDeliveryDays: 3,
            EstimatedDeliveryDate: DateTime.UtcNow.AddDays(3),
            Rating: 4.5m,
            IsRecommended: true);

        Assert.Equal(45, dto.CourierCompanyId);
        Assert.Equal("Blue Dart Surface Reverse", dto.CourierName);
        Assert.Equal(125.50m, dto.FreightCharge);
        Assert.Equal(3, dto.EstimatedDeliveryDays);
        Assert.True(dto.IsRecommended);
    }

    [Theory]
    [InlineData(ReturnReason.DamagedInTransit, "Damaged in transit")]
    [InlineData(ReturnReason.DefectiveOrExpired, "Defective or expired product")]
    [InlineData(ReturnReason.WrongItemReceived, "Wrong item received")]
    [InlineData(ReturnReason.QualityMismatch, "Quality not as expected")]
    [InlineData(ReturnReason.MissingItem, "Missing item from shipment")]
    [InlineData(ReturnReason.LateDelivery, "Arrived too late")]
    [InlineData(ReturnReason.OrderedByMistake, "Ordered by mistake")]
    [InlineData(ReturnReason.PackageTampered, "Package tampered or leaked")]
    [InlineData(ReturnReason.TasteNotAsExpected, "Taste not as expected")]
    public void ReturnReason_ResolvesExpectedDisplayNames(ReturnReason reason, string expectedName)
    {
        var name = pramukhraj.Services.ReturnService.GetReturnReasonName(reason);
        Assert.Equal(expectedName, name);
    }

    [Fact]
    public void ReturnReasonPolicy_EntityPropertiesAndDefaults()
    {
        var policy = new ReturnReasonPolicy
        {
            Reason = ReturnReason.LateDelivery,
            RefundProductAmount = true,
            RefundShippingAmount = true,
            RefundPaymentFee = false
        };

        Assert.Equal(ReturnReason.LateDelivery, policy.Reason);
        Assert.True(policy.RefundProductAmount);
        Assert.True(policy.RefundShippingAmount);
        Assert.False(policy.RefundPaymentFee);
        Assert.True(policy.UpdatedOn <= DateTime.UtcNow);
    }

    [Fact]
    public void ReturnReasonPolicyDtos_BindProperly()
    {
        var item = new UpdateReturnReasonPolicyItem(
            Reason: ReturnReason.PackageTampered,
            RefundProductAmount: true,
            RefundShippingAmount: true,
            RefundPaymentFee: true);

        var request = new UpdateReturnReasonPoliciesRequest([item]);
        Assert.Single(request.Policies);
        Assert.Equal(ReturnReason.PackageTampered, request.Policies[0].Reason);
        Assert.True(request.Policies[0].RefundPaymentFee);

        var dto = new ReturnReasonPolicyDto(
            Reason: ReturnReason.OrderedByMistake,
            ReasonName: "Ordered by mistake",
            RefundProductAmount: true,
            RefundShippingAmount: false,
            RefundPaymentFee: false,
            UpdatedOn: DateTime.UtcNow);

        Assert.Equal(ReturnReason.OrderedByMistake, dto.Reason);
        Assert.Equal("Ordered by mistake", dto.ReasonName);
        Assert.True(dto.RefundProductAmount);
        Assert.False(dto.RefundShippingAmount);
        Assert.False(dto.RefundPaymentFee);
    }
}



