using pramukhraj.Common;
using pramukhraj.DTOs.HomepageCms;

namespace pramukhraj.Interfaces;

public interface IHomepageCmsService
{
    Task<ApiResponse<AdminHomepageCmsResponse>> GetAdminAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> ReplaceAsync(HomepageCmsWriteRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerHomepageHeroResponse>> GetCustomerHeroAsync(CancellationToken cancellationToken = default);
}
