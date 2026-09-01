using pramukhraj.DTOs.Coupon;
using pramukhraj.Validators.Coupon;
using static pramukhraj.Entities.Coupon.CouponEnums;
using Xunit;

namespace pramukhraj.Tests;

public sealed class CouponRequestValidatorTests
{
    private readonly CreateCouponRequestValidator _validator = new();

    [Fact]
    public void ValidAllProductsCoupon_Passes()
    {
        Assert.True(_validator.Validate(ValidRequest()).IsValid);
    }

    [Theory]
    [InlineData(CouponDiscountType.Percentage, 0)]
    [InlineData(CouponDiscountType.Percentage, 101)]
    [InlineData(CouponDiscountType.FlatAmount, 0)]
    [InlineData(CouponDiscountType.FreeShipping, 1)]
    public void InvalidDiscountValue_Fails(CouponDiscountType type, decimal value)
    {
        var request = ValidRequest();
        request.DiscountType = type;
        request.DiscountValue = value;
        request.MaximumDiscountAmount = null;
        Assert.False(_validator.Validate(request).IsValid);
    }

    [Fact]
    public void SpecificProducts_WithOneUniqueId_Passes()
    {
        var request = ValidRequest();
        request.ApplicationScope = CouponApplicationScope.SpecificProducts;
        request.ProductIds = [Guid.NewGuid()];
        Assert.True(_validator.Validate(request).IsValid);
    }

    [Fact]
    public void SpecificProducts_WithoutProduct_Fails()
    {
        var request = ValidRequest();
        request.ApplicationScope = CouponApplicationScope.SpecificProducts;
        Assert.Contains(_validator.Validate(request).Errors, error => error.PropertyName == nameof(request.ProductIds));
    }

    [Fact]
    public void SpecificCategories_WithProductIds_Fails()
    {
        var request = ValidRequest();
        request.ApplicationScope = CouponApplicationScope.SpecificCategories;
        request.CategoryIds = [Guid.NewGuid()];
        request.ProductIds = [Guid.NewGuid()];
        Assert.False(_validator.Validate(request).IsValid);
    }

    [Fact]
    public void AllProducts_WithScopeIds_Fails()
    {
        var request = ValidRequest();
        request.ProductIds = [Guid.NewGuid()];
        Assert.False(_validator.Validate(request).IsValid);
    }

    [Fact]
    public void DuplicateScopeIds_Fail()
    {
        var id = Guid.NewGuid();
        var request = ValidRequest();
        request.ApplicationScope = CouponApplicationScope.SpecificProducts;
        request.ProductIds = [id, id];
        Assert.False(_validator.Validate(request).IsValid);
    }

    [Fact]
    public void EmptyScopeId_Fails()
    {
        var request = ValidRequest();
        request.ApplicationScope = CouponApplicationScope.SpecificProducts;
        request.ProductIds = [Guid.Empty];
        Assert.False(_validator.Validate(request).IsValid);
    }

    [Fact]
    public void InvalidCodeFormat_Fails()
    {
        var request = ValidRequest();
        request.Code = "BAD CODE";
        Assert.False(_validator.Validate(request).IsValid);
    }

    [Fact]
    public void EndBeforeStart_Fails()
    {
        var request = ValidRequest();
        request.EndOn = request.StartOn.AddMinutes(-1);
        Assert.False(_validator.Validate(request).IsValid);
    }

    [Fact]
    public void AlreadyExpiredCoupon_Fails()
    {
        var request = ValidRequest();
        request.StartOn = DateTime.UtcNow.AddDays(-2);
        request.EndOn = DateTime.UtcNow.AddDays(-1);
        Assert.False(_validator.Validate(request).IsValid);
    }

    [Fact]
    public void PerCustomerLimitAboveTotal_Fails()
    {
        var request = ValidRequest();
        request.TotalUsageLimit = 5;
        request.PerCustomerUsageLimit = 6;
        Assert.False(_validator.Validate(request).IsValid);
    }

    [Fact]
    public void MaximumDiscountForFlatCoupon_Fails()
    {
        var request = ValidRequest();
        request.DiscountType = CouponDiscountType.FlatAmount;
        request.DiscountValue = 100;
        request.MaximumDiscountAmount = 50;
        Assert.False(_validator.Validate(request).IsValid);
    }

    private static CreateCouponRequest ValidRequest() => new()
    {
        Code = "WELCOME20",
        Name = "Welcome offer",
        Description = "New customer promotion",
        DiscountType = CouponDiscountType.Percentage,
        DiscountValue = 20,
        MinimumOrderAmount = 499,
        MaximumDiscountAmount = 200,
        ApplicationScope = CouponApplicationScope.AllProducts,
        TotalUsageLimit = 100,
        PerCustomerUsageLimit = 1,
        StartOn = DateTime.UtcNow.AddMinutes(1),
        EndOn = DateTime.UtcNow.AddDays(7),
        IsActive = true
    };
}
