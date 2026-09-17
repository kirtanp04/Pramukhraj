using pramukhraj.Common;
using pramukhraj.DTOs.Customer;

namespace pramukhraj.Interfaces;

public interface ICustomerAddressService
{
    Task<ApiResponse<IReadOnlyList<CustomerAddressResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerAddressResponse>> GetByIdAsync(Guid addressId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerAddressResponse>> CreateAsync(CustomerAddressWriteRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerAddressResponse>> UpdateAsync(Guid addressId, CustomerAddressWriteRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<object>> DeleteAsync(Guid addressId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerAddressResponse>> SetDefaultShippingAsync(Guid addressId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerAddressResponse>> SetDefaultBillingAsync(Guid addressId, CancellationToken cancellationToken = default);
}
