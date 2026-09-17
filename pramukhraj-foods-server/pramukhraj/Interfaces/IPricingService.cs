using pramukhraj.DTOs.Checkout;

namespace pramukhraj.Interfaces;

public interface IPricingService
{
    CheckoutPricingResponse Calculate(PricingCalculationRequest request);
}
