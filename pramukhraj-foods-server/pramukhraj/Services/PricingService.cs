using pramukhraj.DTOs.Checkout;
using pramukhraj.Interfaces;

namespace pramukhraj.Services;

public sealed class PricingService : IPricingService
{
    public CheckoutPricingResponse Calculate(PricingCalculationRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        var mrpTotal = Money(request.Lines.Sum(x => x.UnitMrp * x.Quantity));
        var subtotal = Money(request.Lines.Sum(x => x.UnitPrice * x.Quantity));
        var itemDiscount = Money(Math.Max(0, mrpTotal - subtotal));
        var couponDiscount = Money(Math.Clamp(request.CouponDiscount, 0, subtotal));
        var discountedGoods = Money(subtotal - couponDiscount);
        var taxRate = Math.Clamp(request.TaxRatePercent, 0m, 100m);
        var taxableAmount = discountedGoods;
        var taxAmount = Money(taxableAmount * taxRate / 100m);
        var customerShipping = Money(Math.Max(0, request.CustomerShippingAmount));
        var providerShipping = Money(Math.Max(0, request.ProviderShippingCost));
        return new CheckoutPricingResponse(
            mrpTotal, subtotal, itemDiscount, couponDiscount, taxableAmount, taxAmount,
            customerShipping, providerShipping, Money(discountedGoods + taxAmount + customerShipping), "INR", false, taxRate);
    }

    private static decimal Money(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
