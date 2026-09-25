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
        var productTaxAmount = Money(taxableAmount * taxRate / 100m);
        var customerShipping = Money(Math.Max(0, request.CustomerShippingAmount));
        var providerShipping = Money(Math.Max(0, request.ProviderShippingCost));
        var amountBeforePaymentServiceTax = Money(discountedGoods + productTaxAmount + customerShipping);
        decimal paymentServiceTaxAmount;
        if (request.PaymentProcessingFee > 0)
        {
            paymentServiceTaxAmount = (request.Lines.Count > 0 && amountBeforePaymentServiceTax > 0)
                ? Money(Math.Max(0, request.PaymentProcessingFee))
                : 0m;
        }
        else if (request.PaymentServiceTaxRatePercent > 0)
        {
            var paymentServiceTaxRate = Math.Clamp(request.PaymentServiceTaxRatePercent, 0m, 100m);
            paymentServiceTaxAmount = Money(amountBeforePaymentServiceTax * paymentServiceTaxRate / 100m);
        }
        else
        {
            paymentServiceTaxAmount = 0m;
        }

        var taxAmount = Money(productTaxAmount);
        return new CheckoutPricingResponse(
            mrpTotal, subtotal, itemDiscount, couponDiscount, taxableAmount, productTaxAmount, paymentServiceTaxAmount, taxAmount,
            customerShipping, providerShipping, Money(amountBeforePaymentServiceTax + paymentServiceTaxAmount), "INR", false, taxRate, paymentServiceTaxAmount, paymentServiceTaxAmount);
    }

    private static decimal Money(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
