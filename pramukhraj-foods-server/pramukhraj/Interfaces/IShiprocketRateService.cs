using pramukhraj.DTOs.Checkout;

namespace pramukhraj.Interfaces;

public interface IShiprocketRateService
{
    Task<ShippingRateResult> GetBestRateAsync(ShippingRateRequest request, CancellationToken cancellationToken = default);
    Task<DeliveryServiceabilityResult> VerifyServiceabilityAsync(ShippingRateRequest request, CancellationToken cancellationToken = default);
}
