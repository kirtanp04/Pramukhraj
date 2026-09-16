using pramukhraj.Entities;

namespace pramukhraj.Interfaces
{
    public interface ITokenService
    {
        Task<(string AccessToken, string RefreshToken)> CreateTokensAsync(ApplicationUser user, string ipAddress,bool IsAdmin);
        Task<bool> RevokeRefreshTokenAsync(string refreshToken, string ipAddress);
        Task<(string AccessToken, string RefreshToken, string UserId)> RefreshTokensAsync(string refreshToken, string ipAddress,bool IsAdmin);
    }
}
