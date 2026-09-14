using pramukhraj.Entities.Customer;

namespace pramukhraj.Interfaces;

public sealed record CustomerTokenPair(string AccessToken, string RefreshToken, int ExpiresInSeconds);

public interface ICustomerTokenService
{
    Task<CustomerTokenPair> IssueAsync(Customer customer, string? deviceName, string ipAddress, CancellationToken cancellationToken);
    Task<(Customer Customer, CustomerTokenPair Tokens)> RotateAsync(string refreshToken, string ipAddress, CancellationToken cancellationToken);
    Task RevokeAsync(string refreshToken, CancellationToken cancellationToken);
}
