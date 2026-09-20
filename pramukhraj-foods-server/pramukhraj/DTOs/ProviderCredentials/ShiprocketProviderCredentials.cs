namespace pramukhraj.DTOs.ProviderCredentials;

public sealed class ShiprocketProviderCredentials
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string PickupPostalCode { get; set; } = string.Empty;
    public string? PickupLocation { get; set; }
    public decimal MinimumChargeableWeightKg { get; set; }
}
