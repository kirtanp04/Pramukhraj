using System.Threading.Tasks;
using pramukhraj.Entities;

namespace pramukhraj.Interfaces
{
    public interface ITokenService
    {
        Task<(string AccessToken, string RefreshToken)> CreateTokensAsync(ApplicationUser user, string ipAddress);
        Task<(string AccessToken, string RefreshToken)> CreateTokensForCustomerAsync(Customer customer, string ipAddress);
        Task<bool> RevokeRefreshTokenAsync(string refreshToken, string ipAddress);
    }
}
