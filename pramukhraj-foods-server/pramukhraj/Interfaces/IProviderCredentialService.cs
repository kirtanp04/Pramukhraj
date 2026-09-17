using pramukhraj.Common;
using pramukhraj.DTOs.ProviderCredentials;

namespace pramukhraj.Interfaces;

public interface IProviderCredentialService
{
    Task<ApiResponse<Guid>> CreateAsync(CreateProviderCredentialRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<Guid>> UpdateAsync(string providerKey, UpdateProviderCredentialRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<ProviderCredentialResponse>> GetByKeyAsync(string providerKey, CancellationToken cancellationToken = default);
    Task<TCredential> GetRequiredAsync<TCredential>(string providerKey, CancellationToken cancellationToken = default)
        where TCredential : class;
}
