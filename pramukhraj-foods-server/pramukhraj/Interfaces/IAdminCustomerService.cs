using pramukhraj.Common;
using pramukhraj.DTOs.Customer;

namespace pramukhraj.Interfaces;

public interface IAdminCustomerService
{
    Task<ApiResponse<AdminCustomerListPageResponse>> GetListAsync(AdminCustomerListRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<AdminCustomerDetailsResponse>> GetByIdAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<AdminCustomerDetailsResponse>> PatchAsync(Guid customerId, PatchAdminCustomerRequest request, CancellationToken cancellationToken = default);
}
