using pramukhraj.Common;
using pramukhraj.DTOs.Settings;

namespace pramukhraj.Interfaces;

public interface IStoreSettingsService
{
    Task<ApiResponse<StoreSettingsResponse>> GetAdminAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<StoreSettingsResponse>> UpdateAsync(StoreSettingsWriteRequest request, CancellationToken cancellationToken = default);
    Task<StoreSettingsData> GetCurrentAsync(CancellationToken cancellationToken = default);
}
