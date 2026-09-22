using pramukhraj.DTOs.Checkout;
using pramukhraj.Services;
using Xunit;

namespace pramukhraj.Tests;

public sealed class PricingServiceTests
{
    private readonly PricingService _service = new();

    [Fact]
    public void Calculate_AddsConfiguredExcludedTaxOnce()
    {
        var result = _service.Calculate(new PricingCalculationRequest(
            [new PricingLine(Guid.NewGuid(), Guid.NewGuid(), 100m, 120m, 2)],
            20m,
            40m,
            35m,
            5m,
            0m));

        Assert.Equal(240m, result.MrpTotal);
        Assert.Equal(200m, result.Subtotal);
        Assert.Equal(40m, result.ItemDiscountAmount);
        Assert.Equal(20m, result.CouponDiscountAmount);
        Assert.Equal(9m, result.ProductTaxAmount);
        Assert.Equal(0m, result.PaymentServiceTaxAmount);
        Assert.Equal(9m, result.TaxAmount);
        Assert.Equal(229m, result.GrandTotal);
        Assert.Equal(35m, result.ProviderShippingCost);
        Assert.False(result.TaxIncluded);
        Assert.Equal(5m, result.TaxRatePercent);
    }

    [Fact]
    public void Calculate_ClampsCouponToSubtotalAndNeverReturnsNegativeTotal()
    {
        var result = _service.Calculate(new PricingCalculationRequest(
            [new PricingLine(Guid.NewGuid(), Guid.NewGuid(), 50m, 50m, 1)],
            500m,
            0m,
            0m,
            5m,
            0m));

        Assert.Equal(50m, result.CouponDiscountAmount);
        Assert.Equal(0m, result.GrandTotal);
        Assert.Equal(0m, result.TaxAmount);
    }

    [Fact]
    public void Calculate_AddsPaymentServiceTaxToProductTaxAndGrandTotal()
    {
        var result = _service.Calculate(new PricingCalculationRequest(
            [new PricingLine(Guid.NewGuid(), Guid.NewGuid(), 100m, 100m, 1)],
            0m,
            20m,
            20m,
            5m,
            2m));

        Assert.Equal(5m, result.ProductTaxAmount);
        Assert.Equal(2.50m, result.PaymentServiceTaxAmount);
        Assert.Equal(5m, result.TaxAmount);
        Assert.Equal(127.50m, result.GrandTotal);
        Assert.Equal(2m, result.PaymentServiceTaxRatePercent);
    }

    [Fact]
    public void Calculate_UnregisteredDealer_HasZeroTaxAndCollectsPaymentFee()
    {
        var result = _service.Calculate(new PricingCalculationRequest(
            [new PricingLine(Guid.NewGuid(), Guid.NewGuid(), 200m, 250m, 1)],
            0m,
            83m,
            80m,
            0m,
            2m));

        Assert.Equal(0m, result.ProductTaxAmount);
        Assert.Equal(0m, result.TaxAmount);
        Assert.Equal(5.66m, result.PaymentServiceTaxAmount);
        Assert.Equal(288.66m, result.GrandTotal);
        Assert.Equal(0m, result.TaxRatePercent);
        Assert.Equal(2m, result.PaymentServiceTaxRatePercent);
    }
}
