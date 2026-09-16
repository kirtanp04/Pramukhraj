namespace pramukhraj.DTOs.ProviderCredentials;

public sealed class RazorpayProviderCredentials
{
    public string ApiKey { get; set; } = string.Empty;
    public string KeySecret { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
}
