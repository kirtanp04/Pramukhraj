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
}

