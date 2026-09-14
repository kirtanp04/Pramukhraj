namespace pramukhraj.DTOs.ProviderCredentials;

public sealed class TwilioProviderCredentials
{
    public string AccountSid { get; set; } = string.Empty;
    public string AuthToken { get; set; } = string.Empty;
    public string FromNumber { get; set; } = string.Empty;
    public string ServiceId { get; set; } = string.Empty;
}
