using pramukhraj.DTOs.Checkout;

namespace pramukhraj.Interfaces;

public interface IShiprocketRateService
{
    Task<ShippingRateResult> GetBestRateAsync(ShippingRateRequest request, CancellationToken cancellationToken = default);
}
