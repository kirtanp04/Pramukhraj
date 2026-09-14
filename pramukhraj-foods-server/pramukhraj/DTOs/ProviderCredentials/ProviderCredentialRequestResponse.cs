using System.Text.Json;

namespace pramukhraj.DTOs.ProviderCredentials;

public sealed class CreateProviderCredentialRequest
{
    public string ProviderKey { get; set; } = string.Empty;
    public JsonElement Credentials { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class UpdateProviderCredentialRequest
{
    public JsonElement Credentials { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class ProviderCredentialResponse
{
    public Guid Id { get; set; }
    public string ProviderKey { get; set; } = string.Empty;
    public JsonElement Credentials { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedOn { get; set; }
    public DateTime? UpdatedOn { get; set; }
}
